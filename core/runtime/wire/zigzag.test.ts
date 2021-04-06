import { assertEquals } from "https://deno.land/std@0.84.0/testing/asserts.ts";
import zigzag from "./zigzag.ts";

Deno.test("zigzag", () => {
  assertEquals(zigzag(0), 0);
  assertEquals(zigzag(-1), 1);
  assertEquals(zigzag(1), 2);
  assertEquals(zigzag(-2), 3);
  assertEquals(zigzag(2147483647), 4294967294);
});