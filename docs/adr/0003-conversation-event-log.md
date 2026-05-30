# Append-only conversation event log

Significant conversation state transitions (status changes, bookings, pauses/resumes) are recorded as immutable rows in a `conversation_events` table rather than being derived solely from the mutable `conversations` row.

The `conversations` table stores only the current state (status, funnel_step, paused, version). Without an event log, there is no history of how a conversation reached its current state, when a lead converted, or what sequence of transitions occurred. This makes debugging, auditing, and future analytics difficult.

The event log is append-only: rows are never updated or deleted. The `type` column identifies the transition (`status_changed`, `booked`, `paused`, `resumed`) and the `payload` jsonb column carries the before/after state. The `booked` event is emitted by the classify worker at the moment of Booked transition — the same point where the Slack notification is sent — making it the authoritative record of a conversion.

The alternative — reconstructing history from `messages` timestamps and status snapshots — was rejected because it requires fragile inference and provides no reliable "when did this transition happen" signal.
