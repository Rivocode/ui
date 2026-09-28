import { expect, test } from "bun:test";

/*
 * DOC-09: no page said in which version a prop appeared.
 *
 * In a pre-1.0 library that has already renamed public names twice, whoever
 * has an old version installed has no way of knowing whether the prop they are
 * reading exists for them - and finds out from the type error, or worse, from
 * the stray attribute in the DOM.
 *
 * The marker is not written by hand: it is stamped at release, onto whatever
 * has no stamp yet. So the first version in which the prop appears in the
 * catalog is the one recorded, and nobody needs to remember to note it.
 */

const catalog = await Bun.file("apps/docs/src/component-props.json").json();

test("a stamped prop keeps the version in which it appeared", () => {
  const button = catalog.Button.props.find((prop: { name: string }) => prop.name === "loading");

  expect(button.since).toBe("0.4.0");
});

test("a prop born in this version carries this version", () => {
  // `classNames` was born in 0.5.0, and the release stamp reached it. What
  // this test guards is the difference between the two: an old prop cannot be
  // restamped with today's version, otherwise the marker becomes noise.
  const slider = catalog.Slider.props.find((prop: { name: string }) => prop.name === "classNames");

  expect(slider.since).toBe("0.5.0");
});

test("every stamped prop points to a version the CHANGELOG tells about", async () => {
  const changelog = await Bun.file("CHANGELOG.md").text();
  const versions = new Set(
    Object.values<any>(catalog).flatMap((piece) =>
      piece.props.map((prop: { since?: string }) => prop.since).filter(Boolean),
    ),
  );

  expect(versions.size).toBeGreaterThan(1);
  for (const version of versions) {
    expect(`${version} in CHANGELOG: ${changelog.includes(`## ${version}`)}`).toBe(
      `${version} in CHANGELOG: true`,
    );
  }
});
