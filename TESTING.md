# Pathora Testing Guide

## Automated Backend Tests

Run from the repository root:

```bash
cd server
npm test
```

The backend tests use `mongodb-memory-server`. They cover:

- Auth registration, login, and `/api/auth/me`
- Admin protection for course APIs
- Admin course and topic creation
- Student progress completion and summary
- Confirming no server-side compiler route is exposed

## Frontend Checks

The client does not currently have a Vitest or React Testing Library setup, so component tests were not added yet. Until that setup exists, use the manual checks below after running:

```bash
cd client
npm run dev
```

## Manual Test Cases

1. Register
- Open the app and create a new student account.
- Confirm the user lands in the student experience.
- Try registering with an invalid email or a password shorter than 8 characters and confirm it is rejected.

2. Login
- Log in with the student account.
- Confirm dashboard, courses, roadmap, compiler, quiz, and challenge pages are reachable.
- Log out and confirm protected pages redirect or block access.

3. Admin Create Course
- Log in as an admin account.
- Open the admin content management page.
- Create a course with title, slug, description, category, level, and publish status.
- Confirm the course appears in admin and published courses when published.
- Log in as a student and confirm student cannot access admin course creation APIs or pages.

4. Upload Notes
- As admin, open a topic and upload a PDF notes file.
- Confirm the uploaded file name is displayed.
- Upload a replacement PDF and confirm the old note is replaced.
- Try uploading a non-PDF file and confirm it is rejected.
- Try uploading a PDF larger than 10MB and confirm it is rejected.

5. Student Complete Topic
- As student, open a published course roadmap.
- Mark a topic complete.
- Confirm progress percentage, completed topic count, streak, and dashboard widgets update.
- Refresh the page and confirm completion persists.

6. Run Code
- Open the compiler page.
- Run the default `print("Hello Pathora")` Python code.
- Confirm stdout, stderr, status, and runtime render clearly.
- Enter stdin values and run a program that uses `input()`.
- Submit invalid Python and confirm errors show clearly in the browser.
- Confirm no Judge0 URL, host, or API key is needed.

7. Submit Challenge
- Open a topic with a coding challenge.
- Review visible test cases.
- Submit a passing solution and confirm passed count and score.
- Submit a failing solution and confirm visible failures show output details.
- Confirm hidden test cases do not reveal input or expected output.

8. Environment Variable Safety
- Inspect browser dev tools network responses and built frontend files.
- Confirm there are no Judge0 keys in `server/.env` or frontend files.
- Confirm server 500 errors return `Server error` instead of stack traces or secrets.
