"""Browser regression for the demo-project Firebase emulators and local Vite preview."""
import json
import os
import re
import secrets
import urllib.request

from playwright.sync_api import expect, sync_playwright


BASE = "http://127.0.0.1:5173"
STUDENT_ROUTES = "overview academic subjects timeline resources studymate practice campus campus-care report tickets speak-freely clubs profile settings"
ADMIN_ROUTES = "dashboard enrollments students subjects topic-updates resources complaints clusters assignments departments anonymous-reports clubs analytics settings"


def visit(page, path):
    page.goto(BASE + path, wait_until="domcontentloaded")


def fill_form(page, **fields):
    for name, value in fields.items():
        page.locator(f'form [name="{name}"]').fill(value)


def sign_in(page, path, email, password, target):
    visit(page, path)
    fill_form(page, email=email, password=password)
    page.locator('button[type="submit"]').click()
    page.wait_for_url(f"**/{target}/**")


def verify_email(email):
    base = "http://127.0.0.1:9099"
    with urllib.request.urlopen(base + "/emulator/v1/projects/demo-solvesphere/oobCodes") as response:
        codes = json.load(response)["oobCodes"]
    code = next(c["oobCode"] for c in codes if c["email"] == email)
    request = urllib.request.Request(
        base + "/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-key",
        data=json.dumps({"oobCode": code}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request) as response:
        assert response.status == 200


def fill_report(page):
    visit(page, "/portal/report")
    fill_form(page, title="Browser window repair", floor="2", building="North", room="202",
              description="Please repair the classroom window latch.")


def check_routes(page, prefix, routes):
    for name in routes.split():
        path = prefix + name
        visit(page, path)
        heading = page.get_by_role("heading").first
        expect(heading).to_be_visible()
        assert page.url == BASE + path, page.url
        print("ROUTE", path, heading.inner_text(), flush=True)


def run():
    email = f"browser.{secrets.token_hex(6)}@example.test"
    password = secrets.token_urlsafe(20) + "A1"
    expect.set_options(timeout=30000)
    with sync_playwright() as playwright:
        def browser():
            return playwright.chromium.launch(
                executable_path=os.environ.get("CHROMIUM_EXECUTABLE"),
                args=["--no-sandbox", "--disable-dev-shm-usage", "--no-zygote", "--single-process"],
            )
        student_browser, admin_browser = browser(), browser()
        student, admin = student_browser.new_page(), admin_browser.new_page()
        errors = []
        for page in (student, admin):
            page.on("pageerror", lambda exc: errors.append(str(exc)))
            page.route(re.compile(r"^https?://(?!127\.0\.0\.1[:/]|localhost[:/])"),
                       lambda route: route.abort())

        sign_in(admin, "/auth/admin-login", os.environ["ADMIN_EMAIL"], os.environ["ADMIN_PASSWORD"], "admin")
        visit(student, "/auth/register")
        fill_form(student, fullName="Browser Test Student", email=email, password=password,
                  confirmPassword=password, studentId="AUDIT-2026")
        student.locator('button[type="submit"]').click()
        student.wait_for_url("**/auth/complete-profile")
        expect(student.locator('[name="studentId"]')).to_have_value("AUDIT-2026")
        student.get_by_role("button", name="Submit for Official Verification").click()
        expect(student.get_by_text("PENDING APPROVAL", exact=True)).to_be_visible()
        verify_email(email)

        fill_report(student)
        student.get_by_role("button", name="Submit Issue Report").click()
        expect(student.get_by_role("link", name="View enrollment")).to_have_attribute("href", "/auth/complete-profile")
        print("PASS pending enrollment rejection and recovery link", flush=True)

        visit(admin, "/admin/enrollments")
        admin.get_by_role("button", name="Approve", exact=True).click()
        expect(admin.get_by_text(re.compile("verified and approved"))).to_be_visible()
        student.get_by_role("button", name="Sign out").click()
        sign_in(student, "/auth/login", email, password, "portal")
        fill_report(student)
        student.locator('input[type="file"]').set_input_files(
            {"name": "unavailable.txt", "mimeType": "text/plain", "buffer": b"test"}
        )
        student.get_by_role("button", name="Submit Issue Report").click()
        expect(student.get_by_text(re.compile("Ticket Successfully Stored"))).to_be_visible()
        expect(student.get_by_text(re.compile("were omitted"))).to_be_visible()
        print("PASS approved student ticket with attachment failure warning", flush=True)
        check_routes(student, "/portal/", STUDENT_ROUTES)
        check_routes(admin, "/admin/", ADMIN_ROUTES)
        assert not errors, errors
        student_browser.close()
        admin_browser.close()


if __name__ == "__main__":
    run()
