# Conversational Flow Design

## Natural Language Use Cases

### 1. Account Balance Inquiry → ACS Service

**User Input Examples:**

- "Check balance"
- "What's my balance?"
- "Show my account balance"
- "Balance inquiry"
- "How much money do I have?"

**Intent:** `balance_inquiry`
**Service:** ACS (digit "1")
**Response:** Account balance information

### 2. Account Recharge → ACS Service

**User Input Examples:**

- "Recharge account"
- "Top up my account"
- "Add money"
- "Recharge my phone"
- "I want to recharge"

**Intent:** `recharge_account`
**Service:** ACS (digit "2")
**Response:** Recharge processing confirmation

### 3. Last Transaction History → ACS Service

**User Input Examples:**

- "Show last transaction"
- "Recent activity"
- "Transaction history"
- "Previous transactions"
- "Latest activity"

**Intent:** `last_transaction`
**Service:** ACS (digit "3")
**Response:** Last transaction details

### 4. Talk to Agent/Support → BAP Service

**User Input Examples:**

- "Talk to agent"
- "Speak to customer service"
- "I need help"
- "Connect me to support"
- "Human agent please"
- "Customer support"

**Intent:** `agent_support`
**Service:** BAP (digit "5")
**Response:** Agent connection or support

### 5. Update Details/Transaction → BAP Service

**User Input Examples:**

- "Update my details"
- "Change my information"
- "Modify my profile"
- "Edit account details"
- "Update transaction"
- "Change transaction details"

**Intent:** `update_details`
**Service:** BAP (digit "6")
**Response:** Update processing

### 6. Cancel Action → BAP Service

**User Input Examples:**

- "Cancel"
- "Stop this process"
- "Quit"
- "Exit"
- "Abort transaction"
- "Terminate"

**Intent:** `cancel_action`
**Service:** BAP (digit "7")
**Response:** Cancellation confirmation

### 4. Menu/Options Request → Menu Service

**User Input Examples:**

- "Show menu"
- "What are my options?"
- "Repeat the menu"
- "Go back to main menu"
- "What can I do?"
- "Show me choices"

**Intent:** `menu_repeat`
**Service:** MENU (digit "9")
**Response:** Complete menu options list

## Intent-to-Service Mapping Table

| Intent             | Keywords                                       | Service | Digit Equivalent | Description                |
| ------------------ | ---------------------------------------------- | ------- | ---------------- | -------------------------- |
| `balance_inquiry`  | balance, check, account, money, show           | ACS     | "1"              | Check account balance      |
| `recharge_account` | recharge, top up, add money, reload            | ACS     | "2"              | Recharge account           |
| `last_transaction` | last, recent, history, previous, latest        | ACS     | "3"              | Show last transaction      |
| `agent_support`    | agent, support, help, human, customer service  | BAP     | "5"              | Connect to agent/support   |
| `update_details`   | update, change, modify, edit, details, profile | BAP     | "6"              | Update account/transaction |
| `cancel_action`    | cancel, stop, quit, exit, abort, terminate     | BAP     | "7"              | Cancel current action      |
| `menu_repeat`      | menu, option, choice, repeat, options, main    | MENU    | "9"              | Show menu options          |

## Conversational Flow Diagram

```
User Input (Natural Language)
        ↓
Keyword Matching & Intent Detection
        ↓
Intent Classification
        ↓
    ┌───────────────┬───────────────┬───────────────┬───────────────┬───────────────┬───────────────┬───────────────┐
    ↓               ↓               ↓               ↓               ↓               ↓               ↓
balance_inquiry recharge_account last_transaction agent_support  update_details  cancel_action   menu_repeat
    ↓               ↓               ↓               ↓               ↓               ↓               ↓
ACS Service     ACS Service     ACS Service     BAP Service     BAP Service     BAP Service     Menu Response
(digit "1")     (digit "2")     (digit "3")     (digit "5")     (digit "6")     (digit "7")     (digit "9")
    ↓               ↓               ↓               ↓               ↓               ↓               ↓
Response        Response        Response        Response        Response        Response        Response
```

## API Endpoint Specification

**Endpoint:** `POST /ivr/conversation`

**Request Body:**

```json
{
  "sessionId": "string (required)",
  "query": "string (required) - Natural language input"
}
```

**Response:**

```json
{
  "sessionId": "string",
  "intent": "string",
  "response": "string"
}
```

**Example Request:**

```json
{
  "sessionId": "101",
  "query": "check balance"
}
```

**Example Response:**

```json
{
  "sessionId": "101",
  "intent": "balance_inquiry",
  "response": "ACS: Your account balance is $500."
}
```
