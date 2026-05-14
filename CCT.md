# 10 PIPEDA Princibles ENFORCED

1. Accountability

A designated “privacy steward” monitors CloudWatch logs for access violations.

2. Identifying Purposes

/privacy endpoint clearly states the only purpose: “Provide personalized recent searches and faster suggestions.”

3. Consent

Users explicitly consent during signup; no search history is stored until consent is given.

4. Limiting Collection

Only email/username + salted password hash + last 10 search strings are stored — nothing else.

5. Limiting Use, Disclosure & Retention

Search history capped to 10 entries; oldest entries automatically deleted.

No sharing or exporting to third-party vendors.

6. Accuracy

Users can overwrite search history via /clear_history.

7. Safeguards

Passwords hashed with bcrypt/argon2.

DynamoDB table encrypted with AWS KMS.

IAM policy restricts access to login + search-table only.

8. Openness

/privacy and /data_use_summary endpoints publicly describe what data is stored, why, and for how long.

9. Individual Access

/export_my_data returns all account data + 10-item search history.

/delete_my_data fully deletes the login + search record.

10. Challenging Compliance

/submit_privacy_request logs complaints into DynamoDB + sends SNS alert to steward.
