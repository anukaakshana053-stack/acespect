/**
 * "Conditions for the Provision of the Report" — standard terms appended to the
 * Notes & Post Project section. Numbered clauses, some with (a)/(b) sub-items.
 */
export interface ConditionClause {
  n: string;
  text?: string;
  items?: { label: string; text: string }[];
}

export const CONDITIONS_TITLE = "CONDITIONS FOR THE PROVISION OF THE REPORT";

export const CONDITIONS: ConditionClause[] = [
  {
    n: "1",
    text:
      "The Report is expressly produced for the sole use of the Client and in accordance with AS4349.1. " +
      "Legal liability is limited to the Client.",
  },
  {
    n: "2",
    text:
      "No advice is given regarding the presence, or effect, of termites on the Property. A specialist " +
      "company should be approached to provide such certification if required.",
  },
  { n: "3", text: "Any dimensions given are approximate only." },
  {
    n: "4",
    text:
      "Any cost estimates are approximate only. Should the Client wish to define a price more accurately, " +
      "trade quotations can be arranged.",
  },
  {
    n: "5",
    text:
      "The Client acknowledges, and agrees that any comments contained in the Report relating to matters of " +
      "an electrical, or plumbing nature, are based on a visual inspection only carried out by the Inspector " +
      "on the day of the inspection, and should not in any way be relied upon by the Client as a substitute " +
      "for obtaining expert professional advice from a licensed electrician, or plumber.",
  },
  {
    n: "6",
    text:
      "Any charge-out rates quoted relate to normal work and are not applicable for work relating to " +
      "arbitration, mediation, conciliation, expert witness, court appearance or any other legal application.",
  },
  {
    n: "7",
    text:
      "The Report comments on only those features which were reasonably visible, and reasonably accessible, " +
      "at the time of the inspection without recourse to viewing platforms, the removal, or moving, of " +
      "building components, or any other materials of any kind, or any other unusual methodology including " +
      "measuring or testing of building components to confirm structural soundness or major defects.",
  },
  {
    n: "8",
    text:
      "We have not inspected woodwork or other parts of the structure which are covered, unexposed or " +
      "inaccessible and are therefore unable to report that any such part of the structure is free from defect.",
  },
  {
    n: "9",
    text:
      "Inspections and/or surveys shall be made only by a qualified Building Consultant with no less than " +
      "five years' experience.",
  },
  {
    n: "10",
    text:
      "Only those items in the Report, which have been commented upon, have been inspected. If there is no " +
      "comment against an item it has not been inspected. The Inspector gives no undertaking that they will " +
      "inspect all items present on the day of the inspection.",
  },
  {
    n: "11",
    text:
      "We will not (even if requested to do so) provide you any advice regarding asbestos at the property " +
      "that we are asked to inspect, including whether or not any building materials used in the construction " +
      "of a home are made from asbestos or not. However, if we identify that a building material is made from " +
      "asbestos, we may without any obligation or requirement to do so, mention this to you so that you can " +
      "then have this view confirmed by someone appropriately qualified to advise you about (a) whether the " +
      "material is made from asbestos and (b) how to deal with it. If we provide you such advice, then you " +
      "must not accept or rely upon our view as being in any way determinative and you agree that it is stated " +
      "to you so that you then will engage someone appropriately qualified to advise you on the presence of " +
      "asbestos and related matters, and not act on or rely upon our view in any other way.",
  },
  {
    n: "12",
    text:
      "All advice given by the Inspector not included in the Report is given in good faith. However no " +
      "responsibility is accepted for any losses - either direct or consequential - resulting from the advice.",
  },
  {
    n: "13",
    text:
      "The Report is confirmation of a visual inspection of the Property carried out by the Inspector on the " +
      "day of the inspection, and only covers those items which could reasonably be detected by such visual " +
      "inspection at the time of such inspection.",
  },
  {
    n: "14",
    text:
      "All statutory or implied conditions and warranties are excluded to the extent permitted by law. The " +
      "report is not intended to be a Certificate of Compliance for Building Codes.",
  },
  {
    n: "15",
    text:
      "To the extent permitted by law, liability under any condition or warranty which cannot legally be " +
      "excluded is limited to:",
    items: [
      { label: "(a)", text: "supplying the Report again; or" },
      { label: "(b)", text: "paying the cost of having the Report supplied again." },
    ],
  },
  {
    n: "16",
    text: "If the Report fails to conform in any material respect with the terms and conditions set out herein then",
    items: [
      {
        label: "(a)",
        text:
          "the Inspector is not liable unless the Client notifies the Inspector of the failure within 90 days " +
          "after the date of delivery of the Report; and",
      },
      {
        label: "(b)",
        text:
          "the liability of the Inspector is in any case limited to the cost of providing the inspection and " +
          "the Inspector is not liable for any consequential damage.",
      },
    ],
  },
  {
    n: "17",
    text:
      "The provisions of clause 15 above are subject to the provision of any statutory condition or warranty " +
      "which cannot legally be excluded.",
  },
  {
    n: "18",
    text:
      "Payment to the Inspector will be made at the time of inspection or prior to the supply of the report.",
  },
  {
    n: "19",
    text:
      "The Report will be sent within 48 hours of the inspection or as directed by the Client upon receipt of payment.",
  },
  {
    n: "20",
    text: "The terms and conditions contained herein:",
    items: [
      {
        label: "(a)",
        text:
          "constitute the entire agreement and understanding between the Client and the Inspector, on " +
          "everything connected to the subject matter of the Agreement; and",
      },
      {
        label: "(b)",
        text: "supersede any prior agreement or understanding or anything connected with that subject matter.",
      },
    ],
  },
  {
    n: "21",
    text:
      "These are the standard terms and conditions under which we provide our service to you. When we provide " +
      "you our service, we do so on the basis that (a) these terms and conditions make up the terms of the " +
      "contract between us; and (b) you agree to be bound by these terms and conditions. If you do not agree " +
      "to be bound by these terms and conditions then you must contact us prior to us providing you our " +
      "service to advise us that (a) you do not want to make a contract with us and (b) do not want us to " +
      "provide our service to you.",
  },
];
