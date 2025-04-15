{
    "info": {
        "_postman_id": "a1b2c3d4-e5f6-7890",
            "name": "Company API Tests",
                "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "1. Authentication",
            "item": [
                {
                    "name": "Login (Get JWT Token)",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Content-Type",
                                "value": "application/json"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n  \"email\": \"{{admin_email}}\",\n  \"password\": \"{{admin_password}}\"\n}"
                        },
                        "url": {
                            "raw": "{{base_url}}/api/user/login",
                            "host": ["{{base_url}}"],
                            "path": ["api", "user", "login"]
                        },
                        "events": [
                            {
                                "listen": "test",
                                "script": {
                                    "exec": [
                                        "if (pm.response.code === 200) {",
                                        "    pm.environment.set(\"auth_token\", pm.response.json().token);",
                                        "    pm.test(\"Token saved\", function() {",
                                        "        pm.expect(pm.environment.get(\"auth_token\")).to.not.be.empty;",
                                        "    });",
                                        "}"
                                    ],
                                    "type": "text/javascript"
                                }
                            }
                        ]
                    },
                    "response": []
                }
            ]
        },
        {
            "name": "2. Company Operations",
            "item": [
                {
                    "name": "Create Company",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Authorization",
                                "value": "Bearer {{auth_token}}"
                            },
                            {
                                "key": "Content-Type",
                                "value": "application/json"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n  \"name\": \"Acme Corp\",\n  \"industry\": \"Technology\",\n  \"location\": \"San Francisco\",\n  \"size\": \"11-50\"\n}"
                        },
                        "url": {
                            "raw": "{{base_url}}/api/company",
                            "host": ["{{base_url}}"],
                            "path": ["api", "company"]
                        },
                        "events": [
                            {
                                "listen": "test",
                                "script": {
                                    "exec": [
                                        "pm.test(\"Status code is 201\", function() {",
                                        "    pm.response.to.have.status(201);",
                                        "});",
                                        "",
                                        "pm.test(\"Response has company ID\", function() {",
                                        "    const jsonData = pm.response.json();",
                                        "    pm.expect(jsonData.id).to.be.a('number');",
                                        "    pm.environment.set(\"created_company_id\", jsonData.id);",
                                        "});"
                                    ],
                                    "type": "text/javascript"
                                }
                            }
                        ]
                    },
                    "response": []
                },
                {
                    "name": "Get User's Companies",
                    "request": {
                        "method": "GET",
                        "header": [
                            {
                                "key": "Authorization",
                                "value": "Bearer {{auth_token}}"
                            }
                        ],
                        "url": {
                            "raw": "{{base_url}}/api/company/user-companies",
                            "host": ["{{base_url}}"],
                            "path": ["api", "company", "user-companies"]
                        }
                    },
                    "response": []
                },
                {
                    "name": "Get Specific Company",
                    "request": {
                        "method": "GET",
                        "header": [
                            {
                                "key": "Authorization",
                                "value": "Bearer {{auth_token}}"
                            }
                        ],
                        "url": {
                            "raw": "{{base_url}}/api/company/{{created_company_id}}",
                            "host": ["{{base_url}}"],
                            "path": ["api", "company", "{{created_company_id}}"]
                        }
                    },
                    "response": []
                }
            ]
        },
        {
            "name": "3. Error Cases",
            "item": [
                {
                    "name": "Create Company - Duplicate Name",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Authorization",
                                "value": "Bearer {{auth_token}}"
                            },
                            {
                                "key": "Content-Type",
                                "value": "application/json"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n  \"name\": \"Acme Corp\",\n  \"industry\": \"Technology\",\n  \"location\": \"San Francisco\",\n  \"size\": \"11-50\"\n}"
                        },
                        "url": {
                            "raw": "{{base_url}}/api/company",
                            "host": ["{{base_url}}"],
                            "path": ["api", "company"]
                        },
                        "events": [
                            {
                                "listen": "test",
                                "script": {
                                    "exec": [
                                        "pm.test(\"Status code is 409\", function() {",
                                        "    pm.response.to.have.status(409);",
                                        "});",
                                        "",
                                        "pm.test(\"Error message about duplicate name\", function() {",
                                        "    pm.expect(pm.response.json().error).to.include(\"already exists\");",
                                        "});"
                                    ],
                                    "type": "text/javascript"
                                }
                            }
                        ]
                    },
                    "response": []
                }
            ]
        }
    ],
        "event": [
            {
                "listen": "prerequest",
                "script": {
                    "type": "text/javascript",
                    "exec": [
                        "console.log(\"Testing API at:\", pm.environment.get(\"base_url\"));"
                    ]
                }
            }
        ],
            "variable": [
                {
                    "key": "base_url",
                    "value": "http://localhost:3000"
                },
                {
                    "key": "admin_email",
                    "value": "pinoh71786@ovobri.com"
                },
                {
                    "key": "admin_password",
                    "value": "securePassword123"
                }
            ]
}