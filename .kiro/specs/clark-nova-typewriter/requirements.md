# Requirements Document

## Introduction

Clark Nova Typewriter is a single-page web application (index.html with inline CSS and JS) that serves as a tribute to David Cronenberg's *Naked Lunch* movie. The app simulates the physically accurate mechanics of a Royal Quiet De Luxe typewriter (1956 teal model) — the typewriter that inspired the fictional "Clark Nova" in the film. The application renders a schematic keyboard and a typing canvas where characters are permanently committed to the page, faithfully replicating the constraints and behaviors of a real mechanical typewriter.

## Glossary

- **App**: The single-page web application (index.html with inline CSS and JS) deployed at clarknova.nosocial.net/index.html
- **Typing_Canvas**: The white background canvas area (2480×3508 px, A4 at 300 DPI) occupying the top ~2/3 of the screen where typed characters are rendered
- **Schematic_Keyboard**: The graphical representation of the Royal Quiet De Luxe keyboard layout occupying the bottom ~1/3 of the screen
- **Carriage_Return_Handle**: A graphic element on the left side of the Schematic_Keyboard representing the physical carriage return lever
- **Cursor**: A blinking rectangle indicator (DOS-style) showing where the next character will be printed on the Typing_Canvas
- **Character_Cell**: A single grid cell on the Typing_Canvas measuring 31px wide (2480/80) by 44px tall
- **Ruler**: A scale displayed above and below the Typing_Canvas divided into 80 character positions plus 3 extra on each side
- **Left_Margin**: Character position 10 on the Ruler, the default starting column for each new line
- **Right_Margin**: Character position 70 on the Ruler, the soft limit for typing
- **Hard_Right_Limit**: Character position 80 on the Ruler, the absolute limit for typing
- **Margin_Release**: The MAR REL key that temporarily overrides the Right_Margin stop
- **Overprint**: The visual effect produced when a character is typed over an existing character without erasing it
- **Shift_Lock**: A latching key that remains engaged until released by pressing Left_Shift or Right_Shift
- **Bell**: An audible warning sound triggered when the Cursor reaches position 63

## Requirements

### Requirement 1: Application Structure

**User Story:** As a user, I want a single self-contained HTML page so that the app loads instantly with no dependencies.

#### Acceptance Criteria

1. THE App SHALL consist of a single index.html file containing all CSS, JS, fonts, and audio assets inline (using inline styles, inline scripts, and data URIs for binary assets)
2. THE App SHALL make zero external HTTP requests when loaded (no CDN links, external stylesheets, scripts, fonts, or media files)
3. THE App SHALL be deployed at the path clarknova.nosocial.net/index.html
4. THE App SHALL occupy 100% of the viewport width and 100% of the viewport height with no body margin, no body padding, and no scrollbars visible on initial load

### Requirement 2: Screen Layout

**User Story:** As a user, I want the screen divided into a typing area and a keyboard so that I can see both my output and the input mechanism.

#### Acceptance Criteria

1. THE App SHALL render the Schematic_Keyboard in the bottom approximately one-third of the viewport height (between 30% and 36% of the viewport height)
2. THE App SHALL render the Typing_Canvas area in the remaining top portion of the viewport (between 64% and 70% of the viewport height)
3. THE App SHALL render the Carriage_Return_Handle as a clickable/tappable graphic element positioned to the left of the Schematic_Keyboard keys
4. THE Schematic_Keyboard and the Typing_Canvas area SHALL always be visible simultaneously without requiring scrolling between them

### Requirement 3: Typing Canvas Dimensions

**User Story:** As a user, I want the canvas to represent a standard A4 page so that the output looks like a real typed document.

#### Acceptance Criteria

1. THE Typing_Canvas SHALL have dimensions of 2480×3508 pixels (A4 at 300 DPI)
2. THE Typing_Canvas SHALL have a white background (rgb 255, 255, 255)
3. THE Typing_Canvas SHALL use a Character_Cell width of 31 pixels (2480 divided by 80)
4. THE Typing_Canvas SHALL use a Character_Cell height of 44 pixels, producing 79 usable rows (79 × 44 = 3476 pixels)
5. THE Typing_Canvas SHALL leave the remaining 32 pixels (3508 − 3476) as an unused bottom margin below the last row
6. THE Typing_Canvas SHALL form a grid of exactly 80 columns by 79 rows where each cell is 31×44 pixels with no gaps or overlaps between adjacent cells

### Requirement 4: Ruler Display

**User Story:** As a user, I want rulers above and below the paper so that I can see the character position, just like on a real typewriter carriage.

#### Acceptance Criteria

1. THE App SHALL display a Ruler above the Typing_Canvas divided into 80 character positions, where each position is exactly one Character_Cell width (31px) wide
2. THE App SHALL display a Ruler below the Typing_Canvas divided into 80 character positions, where each position is exactly one Character_Cell width (31px) wide
3. THE Ruler SHALL label positions at every 10 characters using the format: `'0''''|''''1|0''''|''''2|0'' ... '|''''8|0'''`
4. THE Ruler SHALL include 3 extra positions on the left side (outside the paper area), visually offset from the paper-aligned positions
5. THE Ruler SHALL include 3 extra positions on the right side (outside the paper area), visually offset from the paper-aligned positions
6. THE Ruler SHALL align position 0 with the left edge of the Typing_Canvas
7. THE Ruler SHALL align position 80 with the right edge of the Typing_Canvas
8. THE Ruler SHALL mark positions 10 and 70 as margin indicators using a visually distinct symbol or highlight that differentiates them from regular position marks

### Requirement 5: Cursor Behavior

**User Story:** As a user, I want a visible blinking cursor so that I always know where the next character will appear.

#### Acceptance Criteria

1. THE Cursor SHALL appear as a solid filled rectangle that occupies the full Character_Cell (31px wide by 44px tall)
2. THE Cursor SHALL blink with a cycle of 500ms visible and 500ms hidden
3. THE Cursor SHALL indicate the exact Character_Cell where the next typed character will be printed
4. WHEN the App is loaded, THE Cursor SHALL be positioned at row 1, column 10 (Left_Margin)
5. WHEN a character is typed, THE Cursor SHALL advance one position to the right
6. WHILE the Cursor is between position 10 (Left_Margin) and position 69, THE Cursor SHALL display in black color
7. WHILE the Cursor is at position 70 (Right_Margin) or beyond, THE Cursor SHALL display in red color

### Requirement 6: Scrolling

**User Story:** As a user, I want the page to scroll as I type so that the active line is always visible, like feeding paper through a typewriter.

#### Acceptance Criteria

1. WHEN the Typing_Canvas height exceeds the available viewport height for the canvas area, THE App SHALL render only a vertical slice of the Typing_Canvas and allow vertical scrolling
2. THE Cursor SHALL maintain the same column (horizontal position) during scrolling
3. THE Cursor position on the Typing_Canvas SHALL determine the visible vertical slice — the App SHALL keep the Cursor row visible at all times
4. WHEN the Cursor moves below the currently visible area (e.g., via Carriage Return), THE App SHALL scroll down by one line to make the Cursor row visible
5. WHEN the user manually scrolls (mouse wheel or touch drag on the canvas area), THE App SHALL move the visible slice up or down but SHALL NOT move the Cursor
6. WHEN the user types after manual scrolling has moved the view away from the Cursor, THE App SHALL auto-scroll back so the Cursor row is visible before rendering the character
7. THE App SHALL NOT scroll above row 1 or below row 79

### Requirement 7: Permanent Character Rendering

**User Story:** As a user, I want characters to be permanently rendered like ink on paper so that the experience faithfully simulates a real typewriter.

#### Acceptance Criteria

1. WHEN a character is typed, THE Typing_Canvas SHALL render the character as a bitmap in a monospace typewriter font into the Character_Cell at the Cursor position
2. THE Typing_Canvas SHALL NOT provide any mechanism to erase or remove rendered characters (no select, undo, delete, clear, or programmatic removal)
3. WHEN a character is typed at a position that already contains a rendered character, THE Typing_Canvas SHALL render the new character on top of the existing one so that both the old and new character glyphs remain visually visible, creating an Overprint effect
4. WHEN the space character is typed at a position that already contains a rendered character, THE existing character SHALL remain fully visible (space does not obscure previous ink)

### Requirement 8: Typing Sound

**User Story:** As a user, I want audible feedback when typing so that the experience feels like using a real typewriter.

#### Acceptance Criteria

1. WHEN a printable character key is pressed, THE App SHALL produce a short percussive keystroke sound (synthesized or data-URI encoded audio) within 50ms of the key event
2. WHEN the Cursor advances from position 62 to position 63, THE App SHALL produce a metallic Bell sound that is audibly distinct from the keystroke sound
3. THE App SHALL generate audio using the Web Audio API or inline base64-encoded audio data so that no external audio files are required

### Requirement 9: Schematic Keyboard Layout

**User Story:** As a user, I want to see a faithful reproduction of the Royal Quiet De Luxe keyboard so that the interface matches the film's aesthetic.

#### Acceptance Criteria

1. THE Schematic_Keyboard SHALL render a QWERTY layout with 4 rows of keys plus a spacebar row, matching the Royal Quiet De Luxe typewriter
2. THE Schematic_Keyboard row 1 SHALL contain from left to right: BACK SPACE, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, -, =, TAB
3. THE Schematic_Keyboard row 2 SHALL contain from left to right: Q, W, E, R, T, Y, U, I, O, P, plus the ½/¼ key
4. THE Schematic_Keyboard row 3 SHALL contain from left to right: SHIFT LOCK, A, S, D, F, G, H, J, K, L, ;/: key, ¢/@ key, CARRIAGE RETURN indicator
5. THE Schematic_Keyboard row 4 SHALL contain from left to right: LEFT SHIFT, Z, X, C, V, B, N, M, ,/. key (comma/period), ./? key (period/question mark), //blank key, RIGHT SHIFT, MAR REL
6. THE Schematic_Keyboard row 5 SHALL contain the spacebar spanning the width of the letter keys
7. Each key on the Schematic_Keyboard SHALL display the lowercase character as the primary legend and the shifted character as the secondary legend (where applicable)
8. THE Schematic_Keyboard SHALL produce the following lowercase characters: `1234567890-=` / `qwertyuiop½` / `asdfghjkl;¢` / `zxcvbnm,./`
9. THE Schematic_Keyboard SHALL produce the following uppercase (shifted) characters: `!"#$%_&'()*+` / `QWERTYUIOP¼` / `ASDFGHJKL:@` / `ZXCVBNM,.?`

### Requirement 10: Key Visual Feedback

**User Story:** As a user, I want keys to respond visually when pressed so that I can confirm my input.

#### Acceptance Criteria

1. WHEN a key on the Schematic_Keyboard is pressed, THE Schematic_Keyboard SHALL highlight that key by applying a visually distinct pressed state (such as color inversion or a darkened background) that is clearly distinguishable from the key's default unpressed appearance
2. WHEN a key on the Schematic_Keyboard is released, THE Schematic_Keyboard SHALL return that key to its default unpressed appearance
3. WHEN multiple keys are pressed simultaneously (such as a shift key and a printable key), THE Schematic_Keyboard SHALL highlight each pressed key independently

### Requirement 11: Desktop Input

**User Story:** As a desktop user, I want to type using both my physical keyboard and the on-screen schematic keyboard so that I have flexibility in how I interact.

#### Acceptance Criteria

1. WHEN a physical keyboard key that maps to a character in the Schematic_Keyboard layout is pressed on desktop, THE App SHALL produce the corresponding character on the Typing_Canvas
2. WHEN a schematic key is clicked with the mouse on desktop, THE App SHALL produce the corresponding character on the Typing_Canvas
3. WHEN a physical keyboard key that maps to a key in the Schematic_Keyboard layout is pressed on desktop, THE Schematic_Keyboard SHALL highlight the corresponding key
4. WHEN a physical keyboard key that maps to a key in the Schematic_Keyboard layout is released on desktop, THE Schematic_Keyboard SHALL remove the highlight from the corresponding key
5. IF a physical keyboard key is pressed that does not map to any key in the Schematic_Keyboard layout (such as function keys, arrow keys, or Escape), THEN THE App SHALL ignore the keypress and produce no effect
6. WHEN a physical keyboard key that maps to a Schematic_Keyboard key is pressed on desktop, THE App SHALL suppress the browser default action for that key

### Requirement 12: Mobile Input

**User Story:** As a mobile user, I want to type by tapping the schematic keyboard so that I can use the app without a system keyboard interfering.

#### Acceptance Criteria

1. WHEN a schematic key is tapped on a touch-enabled device, THE App SHALL produce the corresponding character on the Typing_Canvas within 100 milliseconds of the touch event
2. THE App SHALL NOT trigger the system on-screen keyboard on touch-enabled devices at any point during interaction
3. THE App SHALL support only the Schematic_Keyboard as the input method on touch-enabled devices
4. WHEN a schematic key is tapped on a touch-enabled device, THE Schematic_Keyboard SHALL highlight the tapped key for the duration of the touch contact
5. THE App SHALL prevent default browser behaviors (zoom, text selection, context menu) on touch interactions with the Schematic_Keyboard

### Requirement 13: Shift Key Mechanics

**User Story:** As a user, I want shift key behavior that mimics a real typewriter so that the uppercase and special character mechanics feel authentic.

#### Acceptance Criteria

1. WHEN Shift_Lock is pressed (clicked on desktop or tapped on mobile), THE Schematic_Keyboard SHALL visually highlight Shift_Lock and keep the shift state engaged until Left_Shift or Right_Shift is pressed
2. WHEN Shift_Lock is engaged and Left_Shift or Right_Shift is pressed once, THE Schematic_Keyboard SHALL disengage the shift state and remove the highlight from Shift_Lock
3. WHILE Shift_Lock is engaged, THE App SHALL produce the shifted character for any printable key pressed via physical keyboard, schematic click, or mobile tap
4. WHEN Left_Shift or Right_Shift is held (physically or via mousedown/touchstart on the schematic key) simultaneously with a printable key on desktop, THE App SHALL produce the shifted character as defined in the Schematic_Keyboard shifted character set
5. WHEN the physical shift key is held and a schematic printable key is clicked on desktop, THE App SHALL produce the shifted character
6. WHEN a schematic shift key is held via mousedown on desktop and a physical printable key is pressed before mouseup, THE App SHALL produce the shifted character
7. WHEN two fingers tap within 150ms of each other on mobile (one on a shift key, one on a printable key), THE App SHALL produce the shifted character
8. IF Left_Shift or Right_Shift is released before a printable key is pressed (and Shift_Lock is not engaged), THEN THE App SHALL produce the unshifted character for the next keypress

### Requirement 14: Margin and Bell Mechanics

**User Story:** As a user, I want margin stops and bell warnings so that the typing experience mirrors the discipline of real typewriter use.

#### Acceptance Criteria

1. WHEN a character is typed at position 62 causing the Cursor to advance to position 63, THE App SHALL produce the Bell sound as a warning of the approaching Right_Margin
2. WHEN the Cursor advances to position 70 (Right_Margin), THE App SHALL stop accepting printable character input while still accepting Backspace, Carriage_Return_Handle activation, and Margin_Release input
3. WHILE the Cursor is stopped at the Right_Margin and Margin_Release has not been activated, THE Cursor SHALL display in red color
4. WHEN the Margin_Release key is pressed and released while the Cursor is at position 70 or beyond, THE App SHALL resume accepting printable character input up to position 80
5. WHEN the Margin_Release is activated, THE Cursor SHALL return to its default color and remain default color while typing between position 70 and position 79
6. WHEN the Cursor advances to position 80 (Hard_Right_Limit) after Margin_Release activation, THE App SHALL stop accepting printable character input while still accepting Backspace and Carriage_Return_Handle activation
7. WHILE the Cursor is at position 80 (Hard_Right_Limit), THE Cursor SHALL display in red color
8. WHEN the Carriage_Return_Handle is activated, THE App SHALL reset the Margin_Release state so that position 70 (Right_Margin) acts as the stop on the new line

### Requirement 15: Carriage Return Behavior

**User Story:** As a user, I want the carriage return to move to the next line just like advancing paper in a typewriter.

#### Acceptance Criteria

1. WHEN the Carriage_Return_Handle is activated (via Enter key press, clicking the Carriage_Return_Handle graphic, or tapping the Carriage_Return_Handle on mobile), THE Cursor SHALL move one line down and return to column 10 (Left_Margin)
2. IF the Cursor is on the last row (row 79) of the Typing_Canvas, THEN the Carriage_Return_Handle activation SHALL have no effect (Cursor SHALL NOT move down and SHALL NOT reset to Left_Margin)
3. WHEN the Carriage_Return_Handle is activated, THE App SHALL reset the Margin_Release state for the new line

### Requirement 16: Backspace Behavior

**User Story:** As a user, I want backspace to move the cursor back without erasing, allowing overprinting just like a real typewriter.

#### Acceptance Criteria

1. WHEN BACK SPACE is pressed and the Cursor is at any position greater than 1, THE Cursor SHALL move one position to the left
2. WHEN BACK SPACE is pressed, THE Typing_Canvas SHALL NOT erase, modify, or obscure any previously rendered character at any position
3. THE Cursor SHALL be able to move left past position 10 (Left_Margin) down to position 1 via BACK SPACE
4. IF the Cursor is at position 1, THEN BACK SPACE SHALL have no effect (the Cursor SHALL NOT move further left)
5. WHEN BACK SPACE moves the Cursor from position 70 or beyond back to a position below 70, THE Cursor SHALL return to its default (black) color

### Requirement 17: No State Persistence

**User Story:** As a user, I accept that reloading the page starts fresh because this simulates the ephemeral experience of typewriting.

#### Acceptance Criteria

1. THE App SHALL NOT use localStorage, sessionStorage, IndexedDB, cookies, or any other client-side persistence mechanism to save typed content, cursor position, or application state between page loads
2. THE App SHALL NOT support multi-page documents — only the single Typing_Canvas is available
3. WHEN the page is reloaded, THE App SHALL present a blank Typing_Canvas with the Cursor at row 1, column 10, with Shift_Lock disengaged, Margin_Release inactive, and no characters rendered
