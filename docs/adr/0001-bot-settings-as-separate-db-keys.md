# Bot settings stored as separate DB keys, not embedded in prompt text

Operator-configurable values (`booking_url`, `coach_name`, `program_length`) are stored as individual rows in the `settings` table rather than hardcoded inside the `system_prompt` string. This allows white-labelling and per-value editing without requiring an operator to locate and change the correct substring inside a large prompt blob. The alternative — one editable prompt string containing everything — was rejected because it couples content editing to structural knowledge of the prompt format.
