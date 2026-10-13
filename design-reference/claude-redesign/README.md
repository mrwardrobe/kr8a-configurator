# Claude Design source

The owner first supplied two standalone `.dc.html` exports, then provided the complete `KR8A Configurator Launch.zip`. Its extracted contents are preserved in `launch-export/kr8a-export/`, including both pages, `kr8a-engine.js`, `kr8a-viewer.js`, `image-slot.js`, `support.js`, the image assets, source README, and eleven desktop/mobile captures. The earlier `.dc.html` files remain as historical references.

The export can be viewed by serving its folder with `python3 -m http.server` and opening the HTML pages through localhost. It depends on Google Fonts and Three.js from esm.sh when run directly. The Next.js implementation bundles Three.js locally and uses the supplied engine and viewer through thin adapters. `image-slot.js` and `support.js` are prototype authoring/support utilities, retained here as reference rather than loaded into the customer site.

The source README explicitly labels pricing, dimensional/structural limits, finishes, hardware and several policy/fulfilment details as placeholders. Its hero and detail images are low-resolution screenshot crops from an existing KR8A site, not original photography. The app displays its price formula only as an illustrative estimate; commercial quoting and manufacturing remain separate work.
