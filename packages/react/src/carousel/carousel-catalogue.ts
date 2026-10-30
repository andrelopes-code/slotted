/**
 * The catalogue every demonstration of the family draws from: eight pieces of
 * a ceramics workshop, each drawn as an SVG data URI so a story renders offline
 * and the harness, both Storybooks and the tests show the same pictures.
 */

export interface Piece {
  name: string;
  price: string;
  glaze: string;
  image: string;
}

export const PIECES: readonly Piece[] = [
  {
    name: 'Terracotta Amphora',
    price: '€89.00',
    glaze: 'salt-glazed stoneware',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23efe6da%22/%3E%3Cstop offset=%221%22 stop-color=%22%23e2d4c1%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%238f4529%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%23c96f4a%22/%3E%3Cstop offset=%221%22 stop-color=%22%238f4529%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23e2d4c1%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M340 380 C300 330 300 270 330 230 C345 210 345 190 335 170 L465 170 C455 190 455 210 470 230 C500 270 500 330 460 380 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Sage Bottle',
    price: '€64.00',
    glaze: 'matte porcelain',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23dfe7e4%22/%3E%3Cstop offset=%221%22 stop-color=%22%23c9d6d1%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%2333584e%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%235e8c7f%22/%3E%3Cstop offset=%221%22 stop-color=%22%2333584e%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23c9d6d1%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M370 385 C340 360 335 300 360 260 C378 232 385 210 385 150 L415 150 C415 210 422 232 440 260 C465 300 460 360 430 385 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Lavender Bowl',
    price: '€48.00',
    glaze: 'stoneware with olive ash',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23e8e3ef%22/%3E%3Cstop offset=%221%22 stop-color=%22%23d6cfe2%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%234b3f72%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%237b6aa8%22/%3E%3Cstop offset=%221%22 stop-color=%22%234b3f72%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23d6cfe2%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M290 300 L510 300 C505 350 465 385 400 385 C335 385 295 350 290 300 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Honey Jug',
    price: '€72.00',
    glaze: 'honey-glazed earthenware',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23f1e9d8%22/%3E%3Cstop offset=%221%22 stop-color=%22%23e3d5b8%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%239a6f22%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%23d4a24c%22/%3E%3Cstop offset=%221%22 stop-color=%22%239a6f22%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23e3d5b8%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M345 385 C325 330 330 260 360 220 L355 185 L445 185 L440 220 C470 260 475 330 455 385 Z M455 240 C505 240 505 320 458 330 L460 312 C485 305 485 260 452 258 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Indigo Cylinder',
    price: '€58.00',
    glaze: 'cobalt stoneware',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23e1e6ee%22/%3E%3Cstop offset=%221%22 stop-color=%22%23cbd3e0%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%232c4366%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%234f6d9a%22/%3E%3Cstop offset=%221%22 stop-color=%22%232c4366%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23cbd3e0%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M350 385 L350 190 C350 180 450 180 450 190 L450 385 C450 395 350 395 350 385 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Dusty Rose Amphora',
    price: '€92.00',
    glaze: 'polished terracotta',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23efe1e1%22/%3E%3Cstop offset=%221%22 stop-color=%22%23e0cbcb%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%237d3a42%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%23b5636b%22/%3E%3Cstop offset=%221%22 stop-color=%22%237d3a42%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23e0cbcb%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M340 380 C300 330 300 270 330 230 C345 210 345 190 335 170 L465 170 C455 190 455 210 470 230 C500 270 500 330 460 380 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Moss Bottle',
    price: '€66.00',
    glaze: 'celadon-glazed stoneware',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23e4ebdf%22/%3E%3Cstop offset=%221%22 stop-color=%22%23d0dbc7%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%234d6533%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%237d9a5b%22/%3E%3Cstop offset=%221%22 stop-color=%22%234d6533%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23d0dbc7%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M370 385 C340 360 335 300 360 260 C378 232 385 210 385 150 L415 150 C415 210 422 232 440 260 C465 300 460 360 430 385 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
  {
    name: 'Charcoal Cylinder',
    price: '€61.00',
    glaze: 'reduction-fired black stoneware',
    image:
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%220%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23eee8e2%22/%3E%3Cstop offset=%221%22 stop-color=%22%23ddd2c6%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22v%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%220%22%3E%3Cstop offset=%220%22 stop-color=%22%231f1b18%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%233f3a36%22/%3E%3Cstop offset=%221%22 stop-color=%22%231f1b18%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22500%22 fill=%22url(%23g)%22/%3E%3Crect y=%22390%22 width=%22800%22 height=%22110%22 fill=%22%23ddd2c6%22 opacity=%22.7%22/%3E%3Cellipse cx=%22400%22 cy=%22390%22 rx=%22120%22 ry=%2212%22 fill=%22%23000%22 opacity=%22.12%22/%3E%3Cpath d=%22M350 385 L350 190 C350 180 450 180 450 190 L450 385 C450 395 350 395 350 385 Z%22 fill=%22url(%23v)%22/%3E%3C/svg%3E',
  },
];

/** Three notices a shop rotates on its front page. */
export const NOTICES = [
  {
    title: 'Autumn Collection',
    body: 'Twelve new salt-glazed stoneware pieces arrive in stores on October 14.',
  },
  {
    title: 'Free shipping',
    body: 'Orders over $60 ship free within the continental United States.',
  },
  {
    title: 'Open workshop',
    body: 'On Saturday mornings, the kiln on Flower Street opens to anyone who wants to watch the firing.',
  },
] as const;
