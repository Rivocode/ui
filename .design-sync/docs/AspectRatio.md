---
category: Structure
---

# AspectRatio

Holds a box's proportion before its content arrives.

```tsx
<AspectRatio ratio={16 / 9}>
  <img src={capa} alt="" />
</AspectRatio>
```

It is for what gets its size from outside: a product image, a map, an embedded
video. Without it the whole row jumps when the image loads, and the person
clicks in the wrong place because the button moved half a second after they
aimed.

An image, video or iframe inside it covers the frame on its own. An image
smaller than the box would leave a gap that looks like a loading defect.

## Why it exists, if CSS already does it

`aspect-ratio` solves this on its own today. The component exists so the
proportion becomes a number passed as a prop, and not yet another arbitrary
class written in each screen, each with a slightly different value.

## In React Native

Translates: `@rivocode/ui-native` exports `AspectRatio` - numeric `ratio`, the same. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
