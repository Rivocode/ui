---
category: Forms
---

# FileUpload

The attach area: a click opens the picker, dragging lights it up, dropping
validates.

The piece knows nothing about the network, on purpose, just as `DataTable`
knows nothing about React Query. Uploading the file (fetch, real progress,
retry) belongs to the app, which knows the endpoint and the authentication.
The piece validates `accept` and `maxSize` on the way in, delivers the accepted
ones in `onSelect` and the rejected ones in `onReject`, each rejection with the
reason ready for a toast: "maior que 5 MB", "tipo não aceito". Without
`multiple`, dropping several delivers the first one, and the others arrive in
`onReject` with "só um arquivo por vez", instead of vanishing silently.

The list presents the state the app reports: `progress` from 0 to 100 becomes
a bar announced as `progressbar`; `error` beats progress, shows the text and
offers "Tentar de novo"; with neither, the file is ready. The size is
formatted by the piece (`48,2 KB`, `1,2 MB`), never typed.

The area is a real `<button>`, so keyboard and screen reader work
effortlessly; the hidden `<input type="file">` carries `accept` and
`multiple`, and the system dialog already filters the types.

Stating the format and the limit in `hint` avoids the rejection: the person
reads "XML ou PDF, até 5 MB" before choosing wrong.

## Parts

`FileUploadList` is the list of what has already come in, and `FileUploadItem`
is each file in it, with name, size, `progress` and `error`. Each file's bar
moves to the new value along its width, at `--rc-duration-base`, instead of
jumping from one number to the next on every upload update. Uploading belongs
to the app: the piece validates on the way in and shows what the app says
afterwards. Whoever controls the upload is whoever knows when it finished.

## Motion

Each `FileUploadItem` enters fading in and rising 4px (`animate-enter`, `--rc-duration-base`), so the newly chosen file is seen arriving in the list. The upload bar moves along its width.

## In React Native

Translates, on its own path `@rivocode/ui-native/file-upload`: `expo-document-picker` is an **optional** peer and a native module (`npx expo install expo-document-picker`), and it has a path separate from `Clipboard` by the same math: the house rule is **one subpath per peer**, and not one per subject. What does not change is the main thing: **the piece still knows nothing about the network**. It validates `accept` and `maxSize` on input, delivers the accepted ones in `onSelect` and the rejected ones in `onReject`, each rejection with its reason ready for a message.

**The drop area becomes a button, and that is the whole piece changing shape.** On the phone there is no dragging: nothing can be dropped anywhere, and the web's 96px dashed rectangle is, letter for letter, the idiom of "drop here": drawing it on a touch screen promises a gesture the device does not have. Take away the dropping, and what remains of that box is a button with a lot of empty space around it: **the space was the drop target, not the affordance**. So the button remains, at a control height. And the height it gives back goes to the **list**, which is where the file appears, uploads, fails and is removed. `hint` still exists, and goes into the button's spoken name for the same reason that on the web it lives inside the `<button>`: whoever listens to the screen needs to know "XML ou PDF, até 5 MB" before opening the picker, not after being rejected.

**`accept` speaks MIME.** Expo's picker filters by type (`text/xml`, `image/*`), not by extension: an `.xml` sent there would match nothing and open an empty dialog. So the dotted extension still works (in the validation on the way back, against the file name), but it does not go to the system. And what comes back is not a `File`: it is a `PickedFile` (`uri`, `name`, `size?`, `mimeType?`), with the local `uri` the app uses to upload. **`size` may be missing**, because not every Android file provider reports it, and so `maxSize` only rejects what it managed to measure. Closing the picker returns `canceled` and no callback fires, like closing the web picker's window.

`FileUploadList` and `FileUploadItem` cross over with the same contract (`progress` from 0 to 100 becomes an announced bar, `error` wins over progress and offers "Tentar de novo"), with two platform differences: the name truncation is `numberOfLines`, which there is a prop and not a class, and the size is formatted **without `Intl`** ("47,1 KB", with the comma written by hand).
