# vimmyroam

The goal of this project is to be able to use Roam with only a keyboard.

![](demo.gif)

## Installation

1. Install [tampermonkey](https://www.tampermonkey.net/)
2. Create a new tampermonkey script
3. Paste the contents of [vimmyroam.js](https://raw.githubusercontent.com/tntmarket/vimmyroam/master/vimmyroam.js) into the tampermonkey editor

Disclaimer: Does not include warranty

## Key Bindings

| Command | Hotkey |
| ------------- | ------------- |
| Scroll Up | k |
| Scroll Down | j |
| Page Up | u |
| Page Down | d |
| Scroll to Top | g, g |
| Scroll to Bottom | G |
| Click Something | f |
| Unfocus | Esc |

### Click Something

Hit "f" to see various hovering hint bubbles. Type the hint next to an element to simulate clicking it.

* Green edits a block
* Yellow clicks on a link
* Purple clicks on a button

Holding shift as you type the hint opens it in the side bar.

## Future Features

| Command | Workaround |
| ------------- | ------------- |
| Focus sidebar | use f to focus a block, Esc, then scroll |
| Hide unreachable hints after keystrokes | None |
| Extract page | None |
| Rename link + page, without going to page itself | None |
| Increment/decrement date | None |
| Open menu for block | None |
| Graph Overview | None |
| All Pages | None |

## Why doesn't Vimium Work?

Vimium doesn't work because Roam blocks don't actually show the textarea until you click on it. vimmyroam simulates actual mouse clicks/hovers to get the text area to show up.

## Surfing Keys

I learned after creating this that [Surfing Keys works in Roam](https://www.youtube.com/watch?time_continue=2&v=ezNK8zXe0UE) with some extra configuration.
