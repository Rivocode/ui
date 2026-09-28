---
category: Feedback
---

# Indicator

The count on top of something else: notices on the bell, items on a tab,
messages in the menu.

It exists as a piece because the alternative is each screen positioning a
`Badge` with `absolute` by hand, and five screens end up with five different
offsets, all with the same defect: the count existing only for those who can
see. Here the number is hidden from the screen reader and the whole `label`
takes its place, because "7" does not say what the seven are.

Zero draws nothing. A pill with "0" draws attention to say there is nothing,
which is the opposite of its job.

Above `max` it shows "99+", instead of the pill stretching and pushing what is
next to it. With `dot`, only the dot shows, for "there is something new here",
when the number does not matter.

The pill sits **on top of** the child, not beside it: it does not reserve
space. That works for a small target (the bell button, the bar item, the
avatar), and always covers text when the child is wide. Above 48px of width,
which is the largest legitimate target in the catalog (a large `Avatar` and an
`lg` control in comfortable density measure exactly that), the piece warns in
the console in development. To mark a whole row, put the count beside it, with
a `Badge`.

## Motion

The pill grows from 60% while fading in when it appears (`animate-pop`, `--rc-duration-fast`): it signals that something arrived, and the short motion pulls the eye without turning into an alarm. A change of number does not repeat the entrance.

## In React Native

Translates, and what changes is who carries the accessible name. On the web the number is hidden from the reader and a reader-only text goes next to it; on native the whole pill is ONE accessibility element, and `label` (required here) is what it announces. The reader reads the child ("Notificações, botão") and then the pill ("3 notificações"), and never a stray "3" between the two. Wrapping child and pill in a single element would fix the reading and break touch, because the inner button would no longer be reachable. The ring that separates the pill from what is underneath becomes a border in the background color: `ring` does not exist in React Native, and a border there takes space inside the box.

The pill is styled through `classNames.badge`, the same name as the web.
