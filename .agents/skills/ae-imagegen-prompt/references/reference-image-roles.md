# Reference Image Roles

Every reference image must be labeled before prompt construction.

| Role | Meaning |
| --- | --- |
| `edit_target` | The image to modify directly. |
| `style_reference` | Visual style, color, mood, or rendering approach. |
| `subject_identity_reference` | Person, character, product, or object identity to preserve. |
| `composition_reference` | Layout, framing, camera angle, or spatial arrangement. |
| `composite_source` | Element to insert or combine with another image. |

## Rules

- Do not treat a style reference as permission to copy identity.
- Do not treat a subject reference as permission to change composition unless requested.
- If a role is ambiguous, ask one concise clarification or choose the safest role and state it.
- For video storyboards, keep subject identity and style roles stable across shots.

