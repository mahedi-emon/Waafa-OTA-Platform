import { describe, expect, it } from "vitest";
import { contactPhones } from "./phone";

describe("contactPhones (issue 181)", () => {
  const main = { phoneDisplay: "01823-232241", phoneE164: "+8801823232241" };

  it("lists the main number first, then the extra numbers in order", () => {
    expect(
      contactPhones({
        ...main,
        extraPhones: [
          { display: "01823-232242", e164: "+8801823232242" },
          { display: "01711-000000", e164: "+8801711000000" },
        ],
      }).map((phone) => phone.display),
    ).toEqual(["01823-232241", "01823-232242", "01711-000000"]);
  });

  it("shows a repeated number once and works without extra numbers", () => {
    expect(
      contactPhones({
        ...main,
        extraPhones: [{ display: "01823 232241", e164: "+8801823232241" }],
      }),
    ).toEqual([{ display: "01823-232241", e164: "+8801823232241" }]);
    expect(contactPhones(main)).toHaveLength(1);
  });
});
