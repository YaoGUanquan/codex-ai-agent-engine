# Web UI Quality

Use this checklist when implementing or reviewing frontend design and UI implementation work:

1. Confirm the target route, entry action, and primary user workflow.
2. Identify design input: free design request, screenshot/Figma/spec match, or existing visual baseline.
3. Reuse the local design system, routing structure, and component patterns.
4. Cover loading, empty, error, success, disabled, and destructive-confirmation states when relevant.
5. Check that labels, helper text, and error messages fit on desktop and mobile.
6. Ensure forms show validation feedback where the user can act on it.
7. Confirm that interactive elements remain stable when async data changes.
8. Meet the accessibility baseline: semantic structure with landmarks and heading order, labeled form controls, keyboard reachability with visible focus, readable text contrast, and alt text for meaningful images.
9. Verify responsive behavior at the breakpoints the design system or layout actually uses, and keep touch targets usable on mobile.
10. Keep layout stable while async content loads: reserve space for images, embeds, and skeletons so late-arriving content does not shift what the user is reading or about to click.
11. Validate in a browser when the UI depends on a dev server, framework runtime, or client-side data flow.
12. Before adding material motion, record the user-relevant purpose or choose the static alternative; preserve the target design system and visual baseline.
13. Default to static UI or minimal CSS state feedback. Treat timeline/physics motion, exported animation assets, and 3D/data scenes as conditional target-project choices rather than workflow dependencies.
14. Provide a `prefers-reduced-motion` or equivalent platform-respecting alternative for material motion, and keep a usable completion state available without waiting for animation.
15. Do not use decorative particle backgrounds for ordinary application surfaces. Use visual effects only when they communicate a user-relevant state, relationship, or outcome.
