// Generated from HOMEMIND_ADMIN_OPENAPI.json; do not edit.
// SHA256: a1d18524342f31da6b6ea400752550cc94dfccca5520f132145771e2f61d9d77
import type { Schema } from './schema';
export const schemas: Record<string, Schema> = {
  "AdminLoginDto": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "format": "email",
        "maxLength": 254
      },
      "password": {
        "type": "string",
        "writeOnly": true,
        "minLength": 16,
        "maxLength": 128,
        "description": "Input only. Never logged or returned."
      }
    },
    "required": [
      "email",
      "password"
    ]
  },
  "Meta": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "requestId",
      "asOf",
      "version",
      "freshness"
    ],
    "properties": {
      "requestId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "asOf": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "version": {
        "type": "string",
        "nullable": false
      },
      "freshness": {
        "type": "string",
        "nullable": false
      }
    }
  },
  "Error": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "error"
    ],
    "properties": {
      "error": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "code",
          "message",
          "requestId",
          "fields"
        ],
        "properties": {
          "code": {
            "type": "string",
            "nullable": false
          },
          "message": {
            "type": "string",
            "nullable": false
          },
          "requestId": {
            "type": "string",
            "nullable": false,
            "format": "uuid"
          },
          "fields": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "field",
                "code"
              ],
              "properties": {
                "field": {
                  "type": "string",
                  "nullable": false
                },
                "code": {
                  "type": "string",
                  "enum": [
                    "INVALID_VALUE",
                    "UNKNOWN_PROPERTY"
                  ]
                }
              }
            }
          }
        }
      }
    }
  },
  "Money": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "currency",
      "amount"
    ],
    "properties": {
      "currency": {
        "type": "string",
        "enum": [
          "VND"
        ]
      },
      "amount": {
        "type": "string",
        "pattern": "^[0-9]+$"
      }
    }
  },
  "Page": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "limit",
      "hasMore",
      "nextCursor"
    ],
    "properties": {
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100
      },
      "hasMore": {
        "type": "boolean"
      },
      "nextCursor": {
        "type": "string",
        "nullable": true
      }
    }
  },
  "Csrf": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "csrfToken",
      "expiresIn"
    ],
    "properties": {
      "csrfToken": {
        "type": "string",
        "nullable": false
      },
      "expiresIn": {
        "type": "integer",
        "minimum": 0
      }
    }
  },
  "Login": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "email",
      "role",
      "sessionId",
      "expiresAt",
      "csrfToken"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "email": {
        "type": "string",
        "format": "email"
      },
      "role": {
        "type": "string",
        "enum": [
          "SYSTEM_ADMIN"
        ]
      },
      "sessionId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "expiresAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "csrfToken": {
        "type": "string",
        "nullable": false
      }
    }
  },
  "Refresh": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "sessionId",
      "expiresAt",
      "csrfToken"
    ],
    "properties": {
      "sessionId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "expiresAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "csrfToken": {
        "type": "string",
        "nullable": false
      }
    }
  },
  "Revoked": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "revoked"
    ],
    "properties": {
      "revoked": {
        "type": "boolean"
      }
    }
  },
  "Identity": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "email",
      "role",
      "sessionId",
      "expiresAt",
      "capabilities",
      "idleSeconds",
      "absoluteSeconds"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "email": {
        "type": "string",
        "format": "email"
      },
      "role": {
        "type": "string",
        "enum": [
          "SYSTEM_ADMIN"
        ]
      },
      "sessionId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "expiresAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "capabilities": {
        "type": "array",
        "items": {
          "type": "string",
          "nullable": false
        }
      },
      "idleSeconds": {
        "type": "integer",
        "minimum": 0
      },
      "absoluteSeconds": {
        "type": "integer",
        "minimum": 0
      }
    }
  },
  "Session": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "createdAt",
      "lastSeenAt",
      "expiresAt",
      "client",
      "current"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "createdAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "lastSeenAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "expiresAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "client": {
        "type": "string",
        "enum": [
          "browser",
          "other"
        ]
      },
      "current": {
        "type": "boolean"
      }
    }
  },
  "Sessions": {
    "type": "array",
    "items": {
      "$ref": "#/components/schemas/Session"
    }
  },
  "Customer": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "email",
      "loginPhone",
      "contactPhone",
      "displayName",
      "address",
      "language",
      "status",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "termsAcceptedAt",
      "privacyAcceptedAt",
      "lastExplicitLoginAt",
      "lastLoginSource",
      "provenance"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "email": {
        "type": "string",
        "nullable": true
      },
      "loginPhone": {
        "type": "string",
        "nullable": true
      },
      "contactPhone": {
        "type": "string",
        "nullable": true
      },
      "displayName": {
        "type": "string",
        "nullable": true
      },
      "address": {
        "type": "string",
        "nullable": true
      },
      "language": {
        "type": "string",
        "nullable": true
      },
      "status": {
        "type": "string",
        "enum": [
          "ACTIVE",
          "DISABLED",
          "DELETED"
        ]
      },
      "createdAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "updatedAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "deletedAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "termsAcceptedAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "privacyAcceptedAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "lastExplicitLoginAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "lastLoginSource": {
        "type": "string",
        "nullable": false
      },
      "provenance": {
        "type": "string",
        "enum": [
          "REAL",
          "SIMULATED_TEST",
          "UNCLASSIFIED_LEGACY"
        ]
      }
    }
  },
  "Quota": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "periodId",
      "plan",
      "policyVersion",
      "startsAt",
      "expiresAt",
      "total",
      "used",
      "reserved",
      "remaining",
      "projectionOnly",
      "entitlementKnown"
    ],
    "properties": {
      "periodId": {
        "type": "string",
        "nullable": true,
        "format": "uuid"
      },
      "plan": {
        "type": "string",
        "nullable": false
      },
      "policyVersion": {
        "type": "string",
        "nullable": false
      },
      "startsAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "expiresAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "total": {
        "type": "integer",
        "minimum": 0
      },
      "used": {
        "type": "integer",
        "minimum": 0
      },
      "reserved": {
        "type": "integer",
        "minimum": 0
      },
      "remaining": {
        "type": "integer",
        "minimum": 0
      },
      "projectionOnly": {
        "type": "boolean"
      },
      "entitlementKnown": {
        "type": "boolean"
      }
    }
  },
  "Workspace": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "name",
      "type",
      "createdAt",
      "updatedAt",
      "archivedAt",
      "plan",
      "source",
      "entitlementKnown",
      "freeLifetimeAccess",
      "productLimit",
      "productCount",
      "grantId",
      "paidExpiresAt",
      "quota",
      "provenance",
      "membershipRole"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "name": {
        "type": "string",
        "nullable": false
      },
      "type": {
        "type": "string",
        "enum": [
          "household",
          "store"
        ]
      },
      "createdAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "updatedAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "archivedAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "plan": {
        "type": "string",
        "nullable": false
      },
      "source": {
        "type": "string",
        "nullable": false
      },
      "entitlementKnown": {
        "type": "boolean"
      },
      "freeLifetimeAccess": {
        "type": "boolean"
      },
      "productLimit": {
        "type": "integer",
        "nullable": true
      },
      "productCount": {
        "type": "integer",
        "minimum": 0
      },
      "grantId": {
        "type": "string",
        "nullable": true,
        "format": "uuid"
      },
      "paidExpiresAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "quota": {
        "$ref": "#/components/schemas/Quota"
      },
      "provenance": {
        "type": "string",
        "enum": [
          "REAL",
          "SIMULATED_TEST",
          "UNCLASSIFIED_LEGACY"
        ]
      },
      "membershipRole": {
        "type": "string",
        "enum": [
          "owner",
          "member"
        ],
        "nullable": true
      }
    }
  },
  "Member": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "workspaceId",
      "userId",
      "role",
      "createdAt"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "workspaceId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "userId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "role": {
        "type": "string",
        "enum": [
          "owner",
          "member"
        ]
      },
      "createdAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      }
    }
  },
  "Payment": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "workspaceId",
      "payerId",
      "orderCode",
      "plan",
      "priceId",
      "money",
      "amountPaid",
      "status",
      "financialState",
      "fulfillment",
      "reviewReason",
      "createdAt",
      "paidAt",
      "cancelledAt",
      "expiresAt",
      "attempts",
      "nextCheckAt",
      "provenance",
      "completedSale"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "workspaceId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "payerId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "orderCode": {
        "type": "string",
        "nullable": false
      },
      "plan": {
        "type": "string",
        "nullable": false
      },
      "priceId": {
        "type": "string",
        "nullable": false
      },
      "money": {
        "$ref": "#/components/schemas/Money"
      },
      "amountPaid": {
        "$ref": "#/components/schemas/Money"
      },
      "status": {
        "type": "string",
        "nullable": false
      },
      "financialState": {
        "type": "string",
        "nullable": false
      },
      "fulfillment": {
        "type": "string",
        "nullable": false
      },
      "reviewReason": {
        "type": "string",
        "nullable": true
      },
      "createdAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "paidAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "cancelledAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "expiresAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "attempts": {
        "type": "integer",
        "minimum": 0
      },
      "nextCheckAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "provenance": {
        "type": "string",
        "nullable": false
      },
      "completedSale": {
        "type": "boolean"
      }
    }
  },
  "Transaction": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "orderId",
      "reference",
      "money",
      "paidAt"
    ],
    "properties": {
      "orderId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "reference": {
        "type": "string",
        "nullable": false
      },
      "money": {
        "$ref": "#/components/schemas/Money"
      },
      "paidAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      }
    }
  },
  "Entitlement": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "workspaceId",
      "orderId",
      "plan",
      "productLimit",
      "startsAt",
      "expiresAt",
      "originalExpiresAt",
      "supersededAt",
      "supersededBy",
      "createdAt"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "workspaceId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "orderId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "plan": {
        "type": "string",
        "nullable": false
      },
      "productLimit": {
        "type": "integer",
        "nullable": true
      },
      "startsAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "expiresAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "originalExpiresAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "supersededAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "supersededBy": {
        "type": "string",
        "nullable": true,
        "format": "uuid"
      },
      "createdAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      }
    }
  },
  "Period": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "workspaceId",
      "plan",
      "policyVersion",
      "startsAt",
      "expiresAt",
      "grantId",
      "total",
      "used"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "workspaceId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "plan": {
        "type": "string",
        "nullable": false
      },
      "policyVersion": {
        "type": "string",
        "nullable": false
      },
      "startsAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "expiresAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "grantId": {
        "type": "string",
        "nullable": true,
        "format": "uuid"
      },
      "total": {
        "type": "integer",
        "minimum": 0
      },
      "used": {
        "type": "integer",
        "minimum": 0
      }
    }
  },
  "UsageRequest": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "workspaceId",
      "actorId",
      "periodId",
      "state",
      "createdAt",
      "completedAt",
      "leaseUntil",
      "charged"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "workspaceId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "actorId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "periodId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "state": {
        "type": "string",
        "enum": [
          "RESERVED",
          "RELEASED",
          "COMMITTED"
        ]
      },
      "createdAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "completedAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "leaseUntil": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "charged": {
        "type": "boolean"
      }
    }
  },
  "Turn": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "workspaceId",
      "actorId",
      "kind",
      "status",
      "processingTimeMs",
      "errorCode",
      "createdAt",
      "expiresAt",
      "committedAt"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "workspaceId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "actorId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "kind": {
        "type": "string",
        "nullable": false
      },
      "status": {
        "type": "string",
        "nullable": false
      },
      "processingTimeMs": {
        "type": "integer",
        "nullable": true
      },
      "errorCode": {
        "type": "string",
        "nullable": true
      },
      "createdAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "expiresAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "committedAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      }
    }
  },
  "Activity": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "recipientId",
      "workspaceId",
      "kind",
      "targetType",
      "targetId",
      "occurredAt",
      "deliveredAt",
      "attempts"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "recipientId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "workspaceId": {
        "type": "string",
        "nullable": true,
        "format": "uuid"
      },
      "kind": {
        "type": "string",
        "nullable": false
      },
      "targetType": {
        "type": "string",
        "nullable": false
      },
      "targetId": {
        "type": "string",
        "nullable": true
      },
      "occurredAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "deliveredAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "attempts": {
        "type": "integer",
        "minimum": 0
      }
    }
  },
  "Notification": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "recipientId",
      "workspaceId",
      "kind",
      "financial",
      "targetType",
      "targetId",
      "occurredAt",
      "receivedAt",
      "readAt"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "recipientId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "workspaceId": {
        "type": "string",
        "nullable": true,
        "format": "uuid"
      },
      "kind": {
        "type": "string",
        "nullable": false
      },
      "financial": {
        "type": "boolean"
      },
      "targetType": {
        "type": "string",
        "nullable": false
      },
      "targetId": {
        "type": "string",
        "nullable": true
      },
      "occurredAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "receivedAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "readAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      }
    }
  },
  "Audit": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "actorId",
      "requestId",
      "action",
      "targetId",
      "outcome",
      "rowCount",
      "occurredAt",
      "scopeHash"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "actorId": {
        "type": "string",
        "nullable": true,
        "format": "uuid"
      },
      "requestId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "action": {
        "type": "string",
        "nullable": false
      },
      "targetId": {
        "type": "string",
        "nullable": true,
        "format": "uuid"
      },
      "outcome": {
        "type": "string",
        "enum": [
          "SUCCESS",
          "DENIED",
          "ERROR"
        ]
      },
      "rowCount": {
        "type": "integer",
        "nullable": true
      },
      "occurredAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "scopeHash": {
        "type": "string",
        "nullable": true
      }
    }
  },
  "QuantityGroup": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "unit",
      "knownQuantity",
      "unknownLots"
    ],
    "properties": {
      "unit": {
        "type": "string",
        "nullable": true
      },
      "knownQuantity": {
        "type": "string",
        "nullable": false
      },
      "unknownLots": {
        "type": "integer",
        "minimum": 0
      }
    }
  },
  "Inventory": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "workspaceId",
      "name",
      "category",
      "unit",
      "status",
      "archivedAt",
      "createdAt",
      "updatedAt",
      "quantity",
      "quantityState",
      "quantityBreakdown",
      "nearestExpiry"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "workspaceId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "name": {
        "type": "string",
        "nullable": false
      },
      "category": {
        "type": "string",
        "nullable": true
      },
      "unit": {
        "type": "string",
        "nullable": true
      },
      "status": {
        "type": "string",
        "nullable": false
      },
      "archivedAt": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "createdAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "updatedAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "quantity": {
        "type": "string",
        "nullable": true
      },
      "quantityState": {
        "type": "string",
        "enum": [
          "empty",
          "known",
          "unknown",
          "mixed",
          "incompatible_units"
        ]
      },
      "quantityBreakdown": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/QuantityGroup"
        }
      },
      "nearestExpiry": {
        "type": "string",
        "format": "date",
        "nullable": true
      }
    }
  },
  "Shopping": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "workspaceId",
      "name",
      "quantity",
      "unit",
      "status",
      "source",
      "linkedProductId",
      "createdBy",
      "createdAt",
      "updatedAt"
    ],
    "properties": {
      "id": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "workspaceId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "name": {
        "type": "string",
        "nullable": false
      },
      "quantity": {
        "type": "string",
        "nullable": true
      },
      "unit": {
        "type": "string",
        "nullable": true
      },
      "status": {
        "type": "string",
        "nullable": false
      },
      "source": {
        "type": "string",
        "nullable": false
      },
      "linkedProductId": {
        "type": "string",
        "nullable": true,
        "format": "uuid"
      },
      "createdBy": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "createdAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "updatedAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      }
    }
  },
  "Spending": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "payerId",
      "provenance",
      "from",
      "to",
      "completedPurchases",
      "completedSpending",
      "refunds",
      "net",
      "refundAvailability"
    ],
    "properties": {
      "payerId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "provenance": {
        "type": "string",
        "nullable": false
      },
      "from": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "to": {
        "type": "string",
        "nullable": true,
        "format": "date-time"
      },
      "completedPurchases": {
        "type": "integer",
        "minimum": 0
      },
      "completedSpending": {
        "$ref": "#/components/schemas/Money"
      },
      "refunds": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "net": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "refundAvailability": {
        "type": "string",
        "nullable": false
      }
    }
  },
  "Overview": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "generatedAt",
      "from",
      "to",
      "timezone",
      "provenance",
      "definitionsVersion",
      "refundAvailability",
      "refunds",
      "net",
      "customers",
      "workspaces",
      "currentlyPayingCustomers",
      "completedSales",
      "completedPurchases",
      "verifiedReceipts",
      "attention",
      "provenanceCounts",
      "committedUsageInWindow",
      "exhaustedWorkspaces",
      "upcomingPaidWorkspaces",
      "expiredUnsupersededGrants",
      "activityAvailability",
      "currentlyCoveredCustomers",
      "usageByPlan"
    ],
    "properties": {
      "generatedAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "from": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "to": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "timezone": {
        "type": "string",
        "nullable": false
      },
      "provenance": {
        "type": "string",
        "nullable": false
      },
      "definitionsVersion": {
        "type": "string",
        "nullable": false
      },
      "refundAvailability": {
        "type": "string",
        "nullable": false
      },
      "refunds": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "net": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "customers": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "total",
          "active",
          "disabled",
          "deleted",
          "newInWindow",
          "allRecords",
          "scopeProvenance",
          "provenanceCounts"
        ],
        "properties": {
          "total": {
            "type": "integer",
            "minimum": 0
          },
          "active": {
            "type": "integer",
            "minimum": 0
          },
          "disabled": {
            "type": "integer",
            "minimum": 0
          },
          "deleted": {
            "type": "integer",
            "minimum": 0
          },
          "newInWindow": {
            "type": "integer",
            "minimum": 0
          },
          "allRecords": {
            "type": "integer",
            "minimum": 0
          },
          "scopeProvenance": {
            "type": "string",
            "nullable": false
          },
          "provenanceCounts": {
            "type": "object",
            "additionalProperties": {
              "type": "integer",
              "minimum": 0
            }
          }
        }
      },
      "workspaces": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "total",
          "active",
          "archived",
          "household",
          "store",
          "allRecords",
          "scopeProvenance",
          "provenanceCounts"
        ],
        "properties": {
          "total": {
            "type": "integer",
            "minimum": 0
          },
          "active": {
            "type": "integer",
            "minimum": 0
          },
          "archived": {
            "type": "integer",
            "minimum": 0
          },
          "household": {
            "type": "integer",
            "minimum": 0
          },
          "store": {
            "type": "integer",
            "minimum": 0
          },
          "allRecords": {
            "type": "integer",
            "minimum": 0
          },
          "scopeProvenance": {
            "type": "string",
            "nullable": false
          },
          "provenanceCounts": {
            "type": "object",
            "additionalProperties": {
              "type": "integer",
              "minimum": 0
            }
          }
        }
      },
      "currentlyPayingCustomers": {
        "type": "integer",
        "minimum": 0
      },
      "completedSales": {
        "$ref": "#/components/schemas/Money"
      },
      "completedPurchases": {
        "type": "integer",
        "minimum": 0
      },
      "verifiedReceipts": {
        "$ref": "#/components/schemas/Money"
      },
      "attention": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "orders",
          "receivedAmount"
        ],
        "properties": {
          "orders": {
            "type": "integer",
            "minimum": 0
          },
          "receivedAmount": {
            "$ref": "#/components/schemas/Money"
          }
        }
      },
      "provenanceCounts": {
        "type": "object",
        "additionalProperties": {
          "type": "integer",
          "minimum": 0
        }
      },
      "committedUsageInWindow": {
        "type": "integer",
        "minimum": 0
      },
      "exhaustedWorkspaces": {
        "type": "integer",
        "minimum": 0
      },
      "upcomingPaidWorkspaces": {
        "type": "integer",
        "minimum": 0
      },
      "expiredUnsupersededGrants": {
        "type": "integer",
        "minimum": 0
      },
      "activityAvailability": {
        "type": "string",
        "nullable": false
      },
      "usageByPlan": {
        "type": "object",
        "additionalProperties": {
          "type": "integer",
          "minimum": 0
        }
      },
      "currentlyCoveredCustomers": {
        "type": "integer",
        "minimum": 0
      }
    }
  },
  "TrendItem": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "bucketLocalStart",
      "completedSales",
      "signups",
      "committedUsage"
    ],
    "properties": {
      "bucketLocalStart": {
        "type": "string",
        "nullable": false
      },
      "completedSales": {
        "$ref": "#/components/schemas/Money"
      },
      "signups": {
        "type": "integer",
        "minimum": 0
      },
      "committedUsage": {
        "type": "integer",
        "minimum": 0
      }
    }
  },
  "Trends": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "generatedAt",
      "from",
      "to",
      "timezone",
      "provenance",
      "definitionsVersion",
      "refundAvailability",
      "refunds",
      "net",
      "bucket",
      "items",
      "comparison",
      "comparisonAvailability"
    ],
    "properties": {
      "generatedAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "from": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "to": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "timezone": {
        "type": "string",
        "nullable": false
      },
      "provenance": {
        "type": "string",
        "nullable": false
      },
      "definitionsVersion": {
        "type": "string",
        "nullable": false
      },
      "refundAvailability": {
        "type": "string",
        "nullable": false
      },
      "refunds": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "net": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "bucket": {
        "type": "string",
        "enum": [
          "day",
          "week",
          "month"
        ]
      },
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/TrendItem"
        }
      },
      "comparison": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "comparisonAvailability": {
        "type": "string",
        "nullable": false
      }
    }
  },
  "PlanDistributionItem": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "segment",
      "plan",
      "workspaces"
    ],
    "properties": {
      "segment": {
        "type": "string",
        "nullable": false
      },
      "plan": {
        "type": "string",
        "nullable": false
      },
      "workspaces": {
        "type": "integer",
        "minimum": 0
      }
    }
  },
  "PlanDistribution": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "generatedAt",
      "from",
      "to",
      "timezone",
      "provenance",
      "definitionsVersion",
      "refundAvailability",
      "refunds",
      "net",
      "items",
      "scope"
    ],
    "properties": {
      "generatedAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "from": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "to": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "timezone": {
        "type": "string",
        "nullable": false
      },
      "provenance": {
        "type": "string",
        "nullable": false
      },
      "definitionsVersion": {
        "type": "string",
        "nullable": false
      },
      "refundAvailability": {
        "type": "string",
        "nullable": false
      },
      "refunds": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "net": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/PlanDistributionItem"
        }
      },
      "scope": {
        "type": "string",
        "nullable": false
      }
    }
  },
  "TopPayingItem": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "payerId",
      "purchases",
      "money"
    ],
    "properties": {
      "payerId": {
        "type": "string",
        "nullable": false,
        "format": "uuid"
      },
      "purchases": {
        "type": "integer",
        "minimum": 0
      },
      "money": {
        "$ref": "#/components/schemas/Money"
      }
    }
  },
  "TopPayingUsers": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "generatedAt",
      "from",
      "to",
      "timezone",
      "provenance",
      "definitionsVersion",
      "refundAvailability",
      "refunds",
      "net",
      "items",
      "limit",
      "scope"
    ],
    "properties": {
      "generatedAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "from": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "to": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "timezone": {
        "type": "string",
        "nullable": false
      },
      "provenance": {
        "type": "string",
        "nullable": false
      },
      "definitionsVersion": {
        "type": "string",
        "nullable": false
      },
      "refundAvailability": {
        "type": "string",
        "nullable": false
      },
      "refunds": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "net": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/TopPayingItem"
        }
      },
      "limit": {
        "type": "integer",
        "minimum": 0
      },
      "scope": {
        "type": "string",
        "nullable": false
      }
    }
  },
  "Operations": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "generatedAt",
      "from",
      "to",
      "timezone",
      "provenance",
      "definitionsVersion",
      "refundAvailability",
      "refunds",
      "net",
      "undeliveredNotifications",
      "exhaustedDeliveryAttempts",
      "staleReservations",
      "missingEntitlements",
      "quotaAnomalies",
      "fundingAnomalies",
      "onlinePresence",
      "providerHealth",
      "availability"
    ],
    "properties": {
      "generatedAt": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "from": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "to": {
        "type": "string",
        "nullable": false,
        "format": "date-time"
      },
      "timezone": {
        "type": "string",
        "nullable": false
      },
      "provenance": {
        "type": "string",
        "nullable": false
      },
      "definitionsVersion": {
        "type": "string",
        "nullable": false
      },
      "refundAvailability": {
        "type": "string",
        "nullable": false
      },
      "refunds": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "net": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "undeliveredNotifications": {
        "type": "integer",
        "minimum": 0
      },
      "exhaustedDeliveryAttempts": {
        "type": "integer",
        "minimum": 0
      },
      "staleReservations": {
        "type": "integer",
        "minimum": 0
      },
      "missingEntitlements": {
        "type": "integer",
        "minimum": 0
      },
      "quotaAnomalies": {
        "type": "integer",
        "minimum": 0
      },
      "fundingAnomalies": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "quotaAnomalies",
          "creditLotAnomalies",
          "creditRequestAnomalies",
          "orphanUseAnomalies"
        ],
        "properties": {
          "quotaAnomalies": {
            "type": "integer",
            "minimum": 0
          },
          "creditLotAnomalies": {
            "type": "integer",
            "minimum": 0
          },
          "creditRequestAnomalies": {
            "type": "integer",
            "minimum": 0
          },
          "orphanUseAnomalies": {
            "type": "integer",
            "minimum": 0
          }
        }
      },
      "onlinePresence": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "providerHealth": {
        "nullable": true,
        "enum": [
          null
        ]
      },
      "availability": {
        "type": "string",
        "nullable": false
      }
    }
  },
  "Vocabulary": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "version",
      "role",
      "plans",
      "segments",
      "accountStatuses",
      "orderStatuses",
      "financialStates",
      "fulfillments",
      "provenances",
      "timezones",
      "pageDefault",
      "pageMax",
      "readOnly",
      "refundsAvailable",
      "mfaAvailable"
    ],
    "properties": {
      "version": {
        "type": "string",
        "nullable": false
      },
      "role": {
        "type": "string",
        "nullable": false
      },
      "plans": {
        "type": "array",
        "items": {
          "type": "string",
          "nullable": false
        }
      },
      "segments": {
        "type": "array",
        "items": {
          "type": "string",
          "nullable": false
        }
      },
      "accountStatuses": {
        "type": "array",
        "items": {
          "type": "string",
          "nullable": false
        }
      },
      "orderStatuses": {
        "type": "array",
        "items": {
          "type": "string",
          "nullable": false
        }
      },
      "financialStates": {
        "type": "array",
        "items": {
          "type": "string",
          "nullable": false
        }
      },
      "fulfillments": {
        "type": "array",
        "items": {
          "type": "string",
          "nullable": false
        }
      },
      "provenances": {
        "type": "array",
        "items": {
          "type": "string",
          "nullable": false
        }
      },
      "timezones": {
        "type": "array",
        "items": {
          "type": "string",
          "nullable": false
        }
      },
      "pageDefault": {
        "type": "integer",
        "minimum": 0
      },
      "pageMax": {
        "type": "integer",
        "minimum": 0
      },
      "readOnly": {
        "type": "boolean"
      },
      "refundsAvailable": {
        "type": "boolean"
      },
      "mfaAvailable": {
        "type": "boolean"
      }
    }
  },
  "CustomerPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Customer"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "WorkspacePage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Workspace"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "MemberPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Member"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "PaymentPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Payment"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "TransactionPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Transaction"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "EntitlementPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Entitlement"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "PeriodPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Period"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "UsageRequestPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/UsageRequest"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "TurnPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Turn"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "ActivityPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Activity"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "NotificationPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Notification"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "AuditPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Audit"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "InventoryPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Inventory"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  },
  "ShoppingPage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items",
      "page"
    ],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Shopping"
        }
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    }
  }
};
export const operations = {
  "adminCsrf": {
    "path": "/v1/admin/auth/csrf",
    "method": "GET",
    "response": "Csrf",
    "query": [],
    "requiredQuery": [],
    "params": [],
    "authenticated": false
  },
  "adminLogin": {
    "path": "/v1/admin/auth/login",
    "method": "POST",
    "response": "Login",
    "query": [],
    "requiredQuery": [],
    "params": [],
    "authenticated": false
  },
  "adminMe": {
    "path": "/v1/admin/auth/me",
    "method": "GET",
    "response": "Identity",
    "query": [],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminRefresh": {
    "path": "/v1/admin/auth/refresh",
    "method": "POST",
    "response": "Refresh",
    "query": [],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminLogout": {
    "path": "/v1/admin/auth/logout",
    "method": "POST",
    "response": "Revoked",
    "query": [],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminLogoutAll": {
    "path": "/v1/admin/auth/logout-all",
    "method": "POST",
    "response": "Revoked",
    "query": [],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminSessions": {
    "path": "/v1/admin/auth/sessions",
    "method": "GET",
    "response": "Sessions",
    "query": [],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminRevokeSession": {
    "path": "/v1/admin/auth/sessions/{sessionId}",
    "method": "DELETE",
    "response": "Revoked",
    "query": [],
    "requiredQuery": [],
    "params": [
      "sessionId"
    ],
    "authenticated": true
  },
  "adminMeta": {
    "path": "/v1/admin/meta",
    "method": "GET",
    "response": "Vocabulary",
    "query": [],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminOverview": {
    "path": "/v1/admin/dashboard/overview",
    "method": "GET",
    "response": "Overview",
    "query": [
      "from",
      "to",
      "provenance",
      "timezone"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminTrends": {
    "path": "/v1/admin/dashboard/trends",
    "method": "GET",
    "response": "Trends",
    "query": [
      "from",
      "to",
      "provenance",
      "timezone",
      "bucket"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminPlanDistribution": {
    "path": "/v1/admin/dashboard/plan-distribution",
    "method": "GET",
    "response": "PlanDistribution",
    "query": [],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminTopPayingUsers": {
    "path": "/v1/admin/dashboard/top-paying-users",
    "method": "GET",
    "response": "TopPayingUsers",
    "query": [
      "from",
      "to",
      "provenance",
      "timezone",
      "limit"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminUsers": {
    "path": "/v1/admin/users",
    "method": "GET",
    "response": "CustomerPage",
    "query": [
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "status",
      "q",
      "segment",
      "plan",
      "paying",
      "provenance"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminUser": {
    "path": "/v1/admin/users/{userId}",
    "method": "GET",
    "response": "Customer",
    "query": [],
    "requiredQuery": [],
    "params": [
      "userId"
    ],
    "authenticated": true
  },
  "adminUserWorkspaces": {
    "path": "/v1/admin/users/{userId}/workspaces",
    "method": "GET",
    "response": "WorkspacePage",
    "query": [
      "userId",
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "segment",
      "plan",
      "archived",
      "provenance"
    ],
    "requiredQuery": [],
    "params": [
      "userId"
    ],
    "authenticated": true
  },
  "adminUserSpending": {
    "path": "/v1/admin/users/{userId}/spending",
    "method": "GET",
    "response": "Spending",
    "query": [
      "from",
      "to",
      "provenance"
    ],
    "requiredQuery": [],
    "params": [
      "userId"
    ],
    "authenticated": true
  },
  "adminUserActivity": {
    "path": "/v1/admin/users/{userId}/activity",
    "method": "GET",
    "response": "ActivityPage",
    "query": [
      "userId",
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "workspaceId",
      "kind"
    ],
    "requiredQuery": [],
    "params": [
      "userId"
    ],
    "authenticated": true
  },
  "adminWorkspaces": {
    "path": "/v1/admin/workspaces",
    "method": "GET",
    "response": "WorkspacePage",
    "query": [
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "segment",
      "plan",
      "archived",
      "userId",
      "provenance"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminWorkspace": {
    "path": "/v1/admin/workspaces/{workspaceId}",
    "method": "GET",
    "response": "Workspace",
    "query": [],
    "requiredQuery": [],
    "params": [
      "workspaceId"
    ],
    "authenticated": true
  },
  "adminWorkspaceMembers": {
    "path": "/v1/admin/workspaces/{workspaceId}/members",
    "method": "GET",
    "response": "MemberPage",
    "query": [
      "workspaceId",
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "userId"
    ],
    "requiredQuery": [],
    "params": [
      "workspaceId"
    ],
    "authenticated": true
  },
  "adminWorkspaceInventory": {
    "path": "/v1/admin/workspaces/{workspaceId}/inventory",
    "method": "GET",
    "response": "InventoryPage",
    "query": [
      "workspaceId",
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "status"
    ],
    "requiredQuery": [],
    "params": [
      "workspaceId"
    ],
    "authenticated": true
  },
  "adminWorkspaceShopping": {
    "path": "/v1/admin/workspaces/{workspaceId}/shopping",
    "method": "GET",
    "response": "ShoppingPage",
    "query": [
      "workspaceId",
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "status"
    ],
    "requiredQuery": [],
    "params": [
      "workspaceId"
    ],
    "authenticated": true
  },
  "adminPayments": {
    "path": "/v1/admin/payments",
    "method": "GET",
    "response": "PaymentPage",
    "query": [
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "status",
      "financialState",
      "fulfillment",
      "provenance",
      "userId",
      "workspaceId"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminPayment": {
    "path": "/v1/admin/payments/{paymentId}",
    "method": "GET",
    "response": "Payment",
    "query": [],
    "requiredQuery": [],
    "params": [
      "paymentId"
    ],
    "authenticated": true
  },
  "adminPaymentTransactions": {
    "path": "/v1/admin/payments/{paymentId}/transactions",
    "method": "GET",
    "response": "TransactionPage",
    "query": [
      "limit",
      "cursor"
    ],
    "requiredQuery": [],
    "params": [
      "paymentId"
    ],
    "authenticated": true
  },
  "adminEntitlements": {
    "path": "/v1/admin/entitlements",
    "method": "GET",
    "response": "EntitlementPage",
    "query": [
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "workspaceId",
      "userId",
      "plan"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminCurrentUsage": {
    "path": "/v1/admin/usage/current",
    "method": "GET",
    "response": "Workspace",
    "query": [
      "workspaceId"
    ],
    "requiredQuery": [
      "workspaceId"
    ],
    "params": [],
    "authenticated": true
  },
  "adminUsagePeriods": {
    "path": "/v1/admin/usage/periods",
    "method": "GET",
    "response": "PeriodPage",
    "query": [
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "workspaceId",
      "userId",
      "plan"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminUsageRequests": {
    "path": "/v1/admin/usage/requests",
    "method": "GET",
    "response": "UsageRequestPage",
    "query": [
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "workspaceId",
      "userId",
      "state"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminUsageTurns": {
    "path": "/v1/admin/usage/turns",
    "method": "GET",
    "response": "TurnPage",
    "query": [
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "workspaceId",
      "userId",
      "status",
      "kind"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminNotifications": {
    "path": "/v1/admin/notifications",
    "method": "GET",
    "response": "NotificationPage",
    "query": [
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "workspaceId",
      "userId",
      "kind",
      "read"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminNotification": {
    "path": "/v1/admin/notifications/{notificationId}",
    "method": "GET",
    "response": "Notification",
    "query": [],
    "requiredQuery": [],
    "params": [
      "notificationId"
    ],
    "authenticated": true
  },
  "adminOperations": {
    "path": "/v1/admin/operations/status",
    "method": "GET",
    "response": "Operations",
    "query": [],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminAuditLogs": {
    "path": "/v1/admin/audit-logs",
    "method": "GET",
    "response": "AuditPage",
    "query": [
      "limit",
      "cursor",
      "sort",
      "from",
      "to",
      "adminId",
      "outcome"
    ],
    "requiredQuery": [],
    "params": [],
    "authenticated": true
  },
  "adminAuditLog": {
    "path": "/v1/admin/audit-logs/{entryId}",
    "method": "GET",
    "response": "Audit",
    "query": [],
    "requiredQuery": [],
    "params": [
      "entryId"
    ],
    "authenticated": true
  }
} as const;
export type OperationId = keyof typeof operations;
