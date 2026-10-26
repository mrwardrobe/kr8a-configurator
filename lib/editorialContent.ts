export type EditorialEntry = {
  slug: string; title: string; description: string; eyebrow: string; intro: string;
  sections: { title: string; paragraphs: string[] }[];
  related: { href: string; label: string }[];
};

export const sideboardPages: EditorialEntry[] = [
  {
    slug: 'narrow-and-shallow', title: 'Narrow & shallow sideboards',
    description: 'A considered sideboard for rooms where width or floor space is precious. Explore how KR8A is developing made-to-measure proportions.',
    eyebrow: 'Sideboards / Compact spaces', intro: 'Storage should give a room more freedom, not take it away.',
    sections: [
      { title: 'Start with the space', paragraphs: [
        'A hallway, alcove or compact dining room can make a standard cabinet feel imposing. Measure the usable width at several heights, then account for skirting, sockets, doors and the route people take through the room.',
        'Depth matters as much as width. A few centimetres can determine whether a drawer opens comfortably or whether a walkway still feels generous. KR8A is developing a range of proportions rather than a single fixed size.',
      ] },
      { title: 'Designed within real limits', paragraphs: [
        'A shallower cabinet needs fittings and storage planned around the available internal depth. Front widths, panel thickness and stability also affect which narrow sizes can be made responsibly.',
        'Our prototype lets us explore these relationships, but supported minimum dimensions and hardware clearances are still being validated. We will publish the confirmed range before taking orders; a 30 cm deep sideboard is not currently promised.',
      ] },
      { title: 'Keep the silhouette calm', paragraphs: [
        'A low profile, considered front layout and the right finish can make practical storage feel architectural. Use the room measurements to guide the proportions, then decide what needs to live behind the doors or in drawers.',
      ] },
    ], related: [{ href: '/journal/how-to-measure-for-a-sideboard', label: 'How to measure for a sideboard' }, { href: '/how-it-works', label: 'How KR8A will work' }],
  },
  {
    slug: 'long', title: 'Long sideboards',
    description: 'Explore long and two-metre sideboard proportions, storage layouts and finishes in the developing KR8A collection.',
    eyebrow: 'Sideboards / Longer proportions', intro: 'A long, quiet line can bring balance to a room.',
    sections: [
      { title: 'A length that belongs', paragraphs: [
        'A broad wall asks for more than a standard cabinet stretched to fill it. Height, depth, front rhythm and the spaces left at either end all shape how a long sideboard sits beneath artwork or beside a dining table.',
        'Two metres is a useful design reference, not a universal answer. It can feel generous in one room and too close to a doorway in another. Measure the wall and leave practical clearance for circulation and access.',
      ] },
      { title: 'Storage across the span', paragraphs: [
        'Longer furniture needs sensible bay widths and an interior planned for the objects it will hold. Doors can keep larger items out of sight; drawers can make smaller everyday things easier to reach. The arrangement should support the structure as well as the composition.',
        'KR8A is refining those rules before the collection opens. Final supported lengths, front combinations and load guidance will be confirmed alongside the manufacturing specification.',
      ] },
      { title: 'One finish, many moods', paragraphs: [
        'An expressive woodgrain appearance can add warmth across a broad front. A quieter finish can give the form more presence than the surface. Our intended decorative engineered-board palette will be specified by exact manufacturer reference before sale.',
      ] },
    ], related: [{ href: '/sideboards/with-drawers', label: 'Explore drawers and doors' }, { href: '/materials', label: 'Our materials approach' }],
  },
  {
    slug: 'with-drawers', title: 'Sideboards with drawers',
    description: 'A made-to-measure sideboard concept that balances drawers, cupboards and considered proportions. Discover the developing KR8A range.',
    eyebrow: 'Sideboards / Storage layout', intro: 'The best arrangement starts with what you need to put away.',
    sections: [
      { title: 'A place for the everyday', paragraphs: [
        'Drawers bring smaller things within easy reach: table linen, paperwork or the objects that otherwise gather on a surface. Cupboards suit taller and less frequently used items. Combining them can make one sideboard work harder without looking busier.',
        'A central drawer bank is one composition we are exploring. Its width and depth must suit the runner system, the surrounding structure and the room available when a drawer is fully open.',
      ] },
      { title: 'Think beyond the front', paragraphs: [
        'A good layout considers the space behind every front. Shelves, drawer travel, handle clearance and the location of nearby furniture all matter. A beautiful elevation is only the beginning of a useful cabinet.',
        'KR8A is developing supported combinations in the configurator. The final specification, hardware and price will be reviewed before any orders open.',
      ] },
      { title: 'A quieter visual rhythm', paragraphs: [
        'Drawer lines can add a precise rhythm to a long cabinet. Keeping the surrounding doors simple lets the detail feel intentional rather than crowded. The right arrangement depends on the overall length and the things you store.',
      ] },
    ], related: [{ href: '/sideboards/long', label: 'Explore long sideboards' }, { href: '/journal/why-standard-sideboards-dont-fit', label: 'Why standard sizes can miss the mark' }],
  },
];

export const journalArticles: EditorialEntry[] = [
  {
    slug: 'why-standard-sideboards-dont-fit', title: 'Why the perfect sideboard is so hard to find',
    description: 'Why a beautiful standard-size sideboard can still be wrong for a room, and what to measure before choosing a better fit.',
    eyebrow: 'Journal / Design', intro: 'The right colour. The right silhouette. Then you check the dimensions.',
    sections: [
      { title: 'The room is the starting point', paragraphs: [
        'Perhaps it is twelve centimetres too long, eight too deep or leaves a gap that makes the piece look accidental. Standard sizes make sense for mass production. Rooms, however, are rarely standard.',
        'Radiators, skirting boards, sockets, doorways and walking space all influence what fits. Measure width, depth and height before falling for a photograph, and check the room at more than one point.',
      ] },
      { title: 'Proportion is more than width', paragraphs: [
        'Allow space for doors to open and drawers to extend. A shallower cabinet may feel lighter in a compact room. A long, low sideboard can settle a broad wall, provided it leaves enough room around it.',
        'Made-to-measure design is not simply stretching a box. Door proportions, drawer widths, panel thicknesses and fittings need to work together. KR8A is developing a considered design that can adapt within practical manufacturing limits.',
      ] },
    ], related: [{ href: '/sideboards', label: 'Explore the sideboard collection' }, { href: '/journal/how-to-measure-for-a-sideboard', label: 'How to measure your space' }],
  },
  {
    slug: 'flat-pack-has-grown-up', title: 'Flat-pack furniture has grown up',
    description: 'Transport and assembly format do not define furniture quality. Explore what thoughtful panel engineering and assembly can achieve.',
    eyebrow: 'Journal / Construction', intro: 'Flat-pack describes how furniture travels. It does not decide how good it can be.',
    sections: [
      { title: 'Engineering begins before the box', paragraphs: [
        'For many people, flat-pack suggests mystery screws, a paper diagram and a cabinet that never feels square. Modern panel machining allows components and connector positions to be designed with far more intention.',
        'Well-chosen hardware, protected edges and a thoughtful assembly sequence can make a meaningful difference to alignment, stability and appearance. A premium result still needs testing: the quality of the components and the clarity of the instructions matter as much as the packaging.',
      ] },
      { title: 'A practical way to move furniture', paragraphs: [
        'Flat packaging can make long panels easier to move and protect. It may reduce empty transport volume, though that alone does not prove a lower environmental footprint. Materials, packaging, journey distances and longevity all matter.',
        'At KR8A, the intended finished sideboard comes first. We are developing the components and assembly approach to deliver that design; final connections and instructions will be confirmed after prototype testing.',
      ] },
    ], related: [{ href: '/journal/hidden-furniture-connectors', label: 'The hidden connectors' }, { href: '/how-it-works', label: 'From your space to your sideboard' }],
  },
  {
    slug: 'hidden-furniture-connectors', title: 'The hidden connectors behind modern furniture',
    description: 'How furniture connectors affect alignment, assembly and repair, and why KR8A is testing the details before launch.',
    eyebrow: 'Journal / Details', intro: 'The cleanest furniture often hides its cleverest engineering.',
    sections: [
      { title: 'The joint shapes the experience', paragraphs: [
        'When two panels meet neatly, you see the line of the design rather than the work behind it. Cabinetmakers have long used dowels, screws, glued joints and specialist fittings. Precisely machined connectors add further possibilities, including some joints designed to be dismantled.',
        'Connector choice affects more than assembly speed. It influences alignment, how a joint is tightened, how a piece travels and whether parts might be replaced. Different panel materials and locations call for different solutions.',
      ] },
      { title: 'Tested before specified', paragraphs: [
        'We are investigating precision-machined systems for KR8A. We have not selected or approved a final connector system, and the right answer may vary between joints.',
        'The best engineering is often quiet. You notice a piece that feels considered, not the effort required to put it together.',
      ] },
    ], related: [{ href: '/journal/flat-pack-has-grown-up', label: 'Flat-pack furniture has grown up' }, { href: '/our-story', label: 'Why we started KR8A' }],
  },
  {
    slug: 'engineered-boards-vs-solid-wood', title: 'Engineered boards and solid wood: choosing with care',
    description: 'A clear look at decorative engineered boards, textured woodgrain finishes and solid timber in contemporary furniture.',
    eyebrow: 'Journal / Materials', intro: 'The right material depends on the design and the way it will be used.',
    sections: [
      { title: 'Different strengths', paragraphs: [
        'Solid wood has natural variation and can often be refinished. It remains a beautiful choice for many pieces. Decorative engineered boards offer a consistent foundation for panel construction, coordinated finishes and precision machining.',
        'A textured woodgrain surface can bring visual depth while remaining materially different from solid timber. An EGGER Feelwood decorative board is not a solid oak or walnut board. We will describe each production finish accurately by its manufacturer reference.',
      ] },
      { title: 'Look at the whole piece', paragraphs: [
        'Surface performance and care depend on the specific board and finish. Edges, joints, heat and moisture exposure still need consideration. No single material is universally superior.',
        'For KR8A, the appeal of decorative engineered panels is the possibility of controlled proportions, coherent finishes across doors and carcass, and repeatable components. The final material range and care advice will be published before orders open.',
      ] },
    ], related: [{ href: '/materials', label: 'Explore our materials approach' }, { href: '/sideboards', label: 'Explore the developing range' }],
  },
  {
    slug: 'how-to-measure-for-a-sideboard', title: 'How to measure for a sideboard',
    description: 'A practical measuring guide for sideboard width, depth, height, door clearance and fitting allowances.',
    eyebrow: 'Journal / Guide', intro: 'Good measurements help furniture look deliberate and properly at home.',
    sections: [
      { title: 'Measure the real space', paragraphs: [
        'Measure the available width at the floor, at the planned top height and around the widest obstruction. Walls and skirting boards may not be perfectly straight. Check depth from the wall to the furthest point the furniture can project without interrupting movement.',
        'Mark nearby doors, radiators, sockets and switches. Check the intended height against window sills, artwork and other furniture.',
      ] },
      { title: 'Leave room to use it', paragraphs: [
        'Allow space for cupboard doors to swing and drawers to extend. Consider walking routes around a dining table or through a hallway. A cabinet can physically fit and still be awkward to live with.',
        'Do not assume a nominal gap is enough for fitting. Floors, walls and manufactured parts all have tolerances. Confirm the installation allowance and any wall-fixing requirements before ordering.',
      ] },
    ], related: [{ href: '/sideboards/narrow-and-shallow', label: 'For compact spaces' }, { href: '/how-it-works', label: 'How KR8A will work' }],
  },
];
