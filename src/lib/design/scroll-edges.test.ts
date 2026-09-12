import { expect, it } from "vitest";
import { scrollEdges } from "./scroll-edges";

it("shows cues only for remaining content, tolerating fractional end positions", () => {
  expect(scrollEdges(0, 400, 400)).toEqual({ left: false, right: false });
  expect(scrollEdges(0, 400, 800)).toEqual({ left: false, right: true });
  expect(scrollEdges(200, 400, 800)).toEqual({ left: true, right: true });
  expect(scrollEdges(399.5, 400, 800)).toEqual({ left: true, right: false });
  expect(scrollEdges(-12, 400, 400)).toEqual({ left: false, right: false });
  expect(scrollEdges(420, 400, 800)).toEqual({ left: true, right: false });
});
