import type { UnitOfMeasure } from '../domain';

/**
 * Catalog vocabulary: a category tree (section 89.10, depth ≤ 4) and product
 * family templates per leaf. Prices are USD dollars; the generator converts.
 */

export interface ProductTypeTemplate {
  /** Product family noun, e.g. "Servo Motor". */
  noun: string;
  /** Model series prefixes combined with a number, e.g. MX-240. */
  series: string[];
  /** Variant axis values; each product owns 1–4 SKUs drawn from these. */
  variants: string[];
  unitOfMeasure: UnitOfMeasure;
  precision: 0 | 1 | 2 | 3;
  priceMin: number;
  priceMax: number;
  /** Cost as fraction of list price. */
  costRatioMin: number;
  costRatioMax: number;
  weightGramsMin: number;
  weightGramsMax: number;
  leadTimeMin: number;
  leadTimeMax: number;
  /** Relative popularity weight of the family when demand is distributed. */
  demand: number;
}

export interface LeafCategoryDefinition {
  name: string;
  brands: string[];
  types: ProductTypeTemplate[];
}

export interface CategoryDefinition {
  name: string;
  children: (CategoryDefinition | LeafCategoryDefinition)[];
}

export function isLeaf(
  definition: CategoryDefinition | LeafCategoryDefinition,
): definition is LeafCategoryDefinition {
  return 'types' in definition;
}

const MOTION_BRANDS = [
  'Promethean Drives',
  'Kestrel Automation',
  'Halden Motion',
  'Orbis Servo',
  'Veltrix',
];
const SENSOR_BRANDS = [
  'Vertex Sensor Technologies',
  'Lumen Sensing',
  'Quanta Instruments',
  'Iridian',
  'Sentra',
];
const ELECTRICAL_BRANDS = [
  'Arcwell Components',
  'Voltaic Works',
  'Copperfield Electric',
  'Brightline Power',
  'Ohmstead',
];
const PNEUMATIC_BRANDS = ['Aeris Pneumatics', 'HydroForge', 'Pressline', 'Cyl-Tek', 'FlowMaster'];
const FASTENER_BRANDS = [
  'DeltaForge Industrial',
  'Ironclad Fasteners',
  'Titan Bolt',
  'Anchorline',
  'Meridian Hardware',
];
const SAFETY_BRANDS = [
  'Guardian Safety',
  'SafeGuard Controls',
  'Sentinel PPE',
  'Aegis Industrial',
  'ClearPath Safety',
];
const TOOL_BRANDS = [
  'Kessler Tools',
  'Hardline Cutting',
  'Precision Edge',
  'Northcut',
  'Vulcan Abrasives',
];
const HANDLING_BRANDS = [
  'Loadstar',
  'Cartwright Systems',
  'Everlift',
  'Palletech',
  'Summit Racking',
];
const ENCLOSURE_BRANDS = [
  'Steelcase Industrial',
  'Nordbox',
  'Cablecore',
  'Wiremax',
  'Enclosure Dynamics',
];
const FLUID_BRANDS = ['Bluewater Pumps', 'Valvetek', 'FlowLogic', 'Hoseline', 'Pumpworks'];
const BEARING_BRANDS = ['Rollmaster', 'Axion Bearings', 'Gearline', 'Kinetix', 'TorqueRight'];
const MRO_BRANDS = ['Asteron Essentials', 'Shopmate', 'Clearline', 'ProClean', 'Workbench Pro'];

function type(
  noun: string,
  series: string[],
  variants: string[],
  price: [number, number],
  options: Partial<ProductTypeTemplate> = {},
): ProductTypeTemplate {
  return {
    noun,
    series,
    variants,
    unitOfMeasure: 'EA',
    precision: 0,
    priceMin: price[0],
    priceMax: price[1],
    costRatioMin: 0.52,
    costRatioMax: 0.72,
    weightGramsMin: 200,
    weightGramsMax: 5_000,
    leadTimeMin: 3,
    leadTimeMax: 21,
    demand: 1,
    ...options,
  };
}

const VOLTAGES = ['24 VDC', '48 VDC', '120 VAC', '230 VAC', '480 VAC'];
const FRAME_SIZES = ['NEMA 17', 'NEMA 23', 'NEMA 34', 'NEMA 42', 'IEC 80', 'IEC 100', 'IEC 132'];
const HP_RATINGS = [
  '0.5 HP',
  '1 HP',
  '2 HP',
  '3 HP',
  '5 HP',
  '7.5 HP',
  '10 HP',
  '15 HP',
  '20 HP',
  '25 HP',
];
const SENSING_RANGES = ['2 mm', '4 mm', '8 mm', '12 mm', '20 mm', '30 mm'];
const THREAD_SIZES = [
  'M6',
  'M8',
  'M10',
  'M12',
  'M16',
  'M20',
  '1/4-20',
  '3/8-16',
  '1/2-13',
  '5/8-11',
];
const LENGTHS_MM = [
  '16 mm',
  '20 mm',
  '25 mm',
  '30 mm',
  '40 mm',
  '50 mm',
  '60 mm',
  '80 mm',
  '100 mm',
];
const BORE_SIZES = ['32 mm', '40 mm', '50 mm', '63 mm', '80 mm', '100 mm'];
const PIPE_SIZES = ['1/4 in', '3/8 in', '1/2 in', '3/4 in', '1 in', '1-1/2 in', '2 in'];
const AWG = ['18 AWG', '16 AWG', '14 AWG', '12 AWG', '10 AWG', '8 AWG'];
const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

export const CATEGORY_TREE: CategoryDefinition[] = [
  {
    name: 'Motion Control',
    children: [
      {
        name: 'Motors',
        children: [
          {
            name: 'Servo Motors',
            brands: MOTION_BRANDS,
            types: [
              type('Servo Motor', ['MX', 'SV', 'AK'], FRAME_SIZES, [640, 3_900], {
                demand: 4,
                weightGramsMin: 1_200,
                weightGramsMax: 18_000,
                leadTimeMin: 10,
                leadTimeMax: 45,
              }),
            ],
          },
          {
            name: 'Stepper Motors',
            brands: MOTION_BRANDS,
            types: [type('Stepper Motor', ['ST', 'HS'], FRAME_SIZES, [48, 420], { demand: 2 })],
          },
          {
            name: 'AC Induction Motors',
            brands: MOTION_BRANDS,
            types: [
              type('AC Induction Motor', ['TEFC', 'ODP'], HP_RATINGS, [210, 4_800], {
                demand: 2,
                weightGramsMin: 8_000,
                weightGramsMax: 90_000,
                leadTimeMin: 7,
                leadTimeMax: 35,
              }),
            ],
          },
          {
            name: 'Gearmotors',
            brands: MOTION_BRANDS,
            types: [
              type(
                'Gearmotor',
                ['GM', 'RW'],
                ['5:1', '10:1', '20:1', '40:1', '60:1'],
                [320, 2_400],
                { weightGramsMin: 3_000, weightGramsMax: 30_000 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Drives',
        children: [
          {
            name: 'Variable Frequency Drives',
            brands: MOTION_BRANDS,
            types: [
              type(
                'Variable Frequency Drive',
                ['VX', 'VF', 'PowerFlex'],
                HP_RATINGS,
                [380, 6_200],
                { demand: 3, leadTimeMin: 7, leadTimeMax: 30 },
              ),
            ],
          },
          {
            name: 'Servo Drives',
            brands: MOTION_BRANDS,
            types: [
              type(
                'Servo Drive',
                ['SD', 'AXD'],
                ['400 W', '750 W', '1.5 kW', '3 kW', '5 kW'],
                [560, 4_100],
                { demand: 2 },
              ),
            ],
          },
          {
            name: 'Soft Starters',
            brands: MOTION_BRANDS,
            types: [type('Soft Starter', ['SS', 'SR'], HP_RATINGS, [290, 3_200])],
          },
        ],
      },
      {
        name: 'Motion Components',
        children: [
          {
            name: 'Linear Actuators',
            brands: MOTION_BRANDS,
            types: [
              type(
                'Linear Actuator',
                ['LA', 'EAC'],
                ['100 mm stroke', '200 mm stroke', '300 mm stroke', '500 mm stroke'],
                [420, 2_900],
              ),
            ],
          },
          {
            name: 'Couplings',
            brands: BEARING_BRANDS,
            types: [
              type(
                'Servo Coupling',
                ['BC', 'JC'],
                ['8 mm', '10 mm', '12 mm', '14 mm', '19 mm', '24 mm'],
                [28, 260],
                { demand: 2 },
              ),
            ],
          },
          {
            name: 'Encoders',
            brands: SENSOR_BRANDS,
            types: [
              type(
                'Rotary Encoder',
                ['RE', 'ENC'],
                ['1024 PPR', '2048 PPR', '4096 PPR', '5000 PPR'],
                [140, 980],
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Sensors & Instrumentation',
    children: [
      {
        name: 'Proximity Sensors',
        children: [
          {
            name: 'Inductive Sensors',
            brands: SENSOR_BRANDS,
            types: [
              type('Inductive Sensor', ['IS', 'IPS'], SENSING_RANGES, [34, 220], {
                demand: 5,
                weightGramsMin: 40,
                weightGramsMax: 300,
                leadTimeMin: 2,
                leadTimeMax: 10,
              }),
            ],
          },
          {
            name: 'Capacitive Sensors',
            brands: SENSOR_BRANDS,
            types: [
              type('Capacitive Sensor', ['CS', 'CPS'], SENSING_RANGES, [48, 290], {
                weightGramsMin: 40,
                weightGramsMax: 300,
              }),
            ],
          },
          {
            name: 'Photoelectric Sensors',
            brands: SENSOR_BRANDS,
            types: [
              type(
                'Photoelectric Sensor',
                ['PE', 'OPT'],
                ['Diffuse', 'Retroreflective', 'Through-beam', 'Background suppression'],
                [62, 410],
                { demand: 3, weightGramsMin: 40, weightGramsMax: 400 },
              ),
            ],
          },
          {
            name: 'Ultrasonic Sensors',
            brands: SENSOR_BRANDS,
            types: [
              type(
                'Ultrasonic Sensor',
                ['US', 'UDS'],
                ['250 mm', '500 mm', '1 m', '2 m', '6 m'],
                [110, 680],
              ),
            ],
          },
        ],
      },
      {
        name: 'Process Instrumentation',
        children: [
          {
            name: 'Pressure Transmitters',
            brands: SENSOR_BRANDS,
            types: [
              type(
                'Pressure Transmitter',
                ['PT', 'PX'],
                ['0–100 psi', '0–300 psi', '0–1000 psi', '0–3000 psi'],
                [180, 1_450],
                { leadTimeMin: 5, leadTimeMax: 28 },
              ),
            ],
          },
          {
            name: 'Temperature Sensors',
            brands: SENSOR_BRANDS,
            types: [
              type('RTD Probe', ['RTD', 'PT100'], LENGTHS_MM, [42, 380], { demand: 2 }),
              type('Thermocouple', ['TC-K', 'TC-J'], LENGTHS_MM, [24, 210], { demand: 2 }),
            ],
          },
          {
            name: 'Flow Meters',
            brands: FLUID_BRANDS,
            types: [
              type('Magnetic Flow Meter', ['MF', 'FLX'], PIPE_SIZES, [900, 6_800], {
                leadTimeMin: 10,
                leadTimeMax: 42,
                weightGramsMin: 2_000,
                weightGramsMax: 40_000,
              }),
            ],
          },
          {
            name: 'Level Sensors',
            brands: SENSOR_BRANDS,
            types: [
              type(
                'Level Switch',
                ['LS', 'FLT'],
                ['Float', 'Capacitive', 'Radar', 'Guided wave'],
                [96, 2_100],
              ),
            ],
          },
        ],
      },
      {
        name: 'Vision & Identification',
        children: [
          {
            name: 'Barcode Readers',
            brands: SENSOR_BRANDS,
            types: [type('Barcode Reader', ['BR', 'ID'], ['1D', '2D', 'DPM'], [420, 2_600])],
          },
          {
            name: 'Vision Sensors',
            brands: SENSOR_BRANDS,
            types: [
              type(
                'Vision Sensor',
                ['VS', 'CAM'],
                ['640×480', '1280×960', '1920×1200'],
                [980, 4_900],
                { leadTimeMin: 7, leadTimeMax: 30 },
              ),
            ],
          },
          {
            name: 'RFID',
            brands: SENSOR_BRANDS,
            types: [type('RFID Reader', ['RF', 'UHF'], ['LF', 'HF', 'UHF'], [310, 1_900])],
          },
        ],
      },
    ],
  },
  {
    name: 'Control & Automation',
    children: [
      {
        name: 'Controllers',
        children: [
          {
            name: 'Industrial Controllers',
            brands: MOTION_BRANDS,
            types: [
              type(
                'Industrial Controller',
                ['IC', 'PLC'],
                ['16 I/O', '32 I/O', '64 I/O', '128 I/O'],
                [820, 7_400],
                { demand: 3, leadTimeMin: 7, leadTimeMax: 40 },
              ),
            ],
          },
          {
            name: 'I/O Modules',
            brands: MOTION_BRANDS,
            types: [
              type(
                'Digital I/O Module',
                ['DI', 'DO', 'DIO'],
                ['8-point', '16-point', '32-point'],
                [160, 720],
                { demand: 3 },
              ),
              type('Analog I/O Module', ['AI', 'AO'], ['4-channel', '8-channel'], [240, 1_100], {
                demand: 2,
              }),
            ],
          },
          {
            name: 'Safety Controllers',
            brands: SAFETY_BRANDS,
            types: [
              type('Safety Controller', ['SC', 'SFC'], ['8 I/O', '16 I/O', '24 I/O'], [640, 3_100]),
            ],
          },
        ],
      },
      {
        name: 'HMI & Operator Interface',
        children: [
          {
            name: 'HMI Panels',
            brands: MOTION_BRANDS,
            types: [
              type(
                'HMI Panel',
                ['HP', 'TP'],
                ['4.3 in', '7 in', '10 in', '12 in', '15 in'],
                [520, 4_200],
                { weightGramsMin: 800, weightGramsMax: 6_000 },
              ),
            ],
          },
          {
            name: 'Pushbuttons & Pilot Lights',
            brands: ELECTRICAL_BRANDS,
            types: [
              type(
                'Pushbutton Operator',
                ['PB', 'OP'],
                ['22 mm Green', '22 mm Red', '22 mm Yellow', '30 mm Green', '30 mm Red'],
                [12, 78],
                { demand: 3, weightGramsMin: 30, weightGramsMax: 120 },
              ),
              type('Pilot Light', ['PL', 'IL'], VOLTAGES, [14, 62], {
                demand: 2,
                weightGramsMin: 30,
                weightGramsMax: 120,
              }),
            ],
          },
          {
            name: 'Stack Lights',
            brands: ELECTRICAL_BRANDS,
            types: [
              type(
                'Stack Light',
                ['SL', 'TL'],
                ['1-tier', '2-tier', '3-tier', '4-tier', '5-tier'],
                [64, 340],
              ),
            ],
          },
        ],
      },
      {
        name: 'Networking',
        children: [
          {
            name: 'Industrial Ethernet Switches',
            brands: ENCLOSURE_BRANDS,
            types: [
              type(
                'Managed Ethernet Switch',
                ['ES', 'IES'],
                ['5-port', '8-port', '16-port', '24-port'],
                [210, 2_400],
                { demand: 2 },
              ),
            ],
          },
          {
            name: 'Gateways',
            brands: MOTION_BRANDS,
            types: [
              type(
                'Protocol Gateway',
                ['GW', 'PG'],
                ['EtherNet/IP', 'PROFINET', 'Modbus TCP', 'EtherCAT'],
                [380, 1_800],
              ),
            ],
          },
          {
            name: 'Wireless',
            brands: ENCLOSURE_BRANDS,
            types: [
              type(
                'Industrial Access Point',
                ['AP', 'WL'],
                ['2.4 GHz', '5 GHz', 'Dual band'],
                [290, 1_600],
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Electrical',
    children: [
      {
        name: 'Power Distribution',
        children: [
          {
            name: 'Circuit Breakers',
            brands: ELECTRICAL_BRANDS,
            types: [
              type(
                'Miniature Circuit Breaker',
                ['MCB', 'CB'],
                ['1P 10 A', '1P 16 A', '1P 20 A', '2P 20 A', '3P 32 A', '3P 63 A'],
                [18, 240],
                { demand: 4, weightGramsMin: 80, weightGramsMax: 900 },
              ),
            ],
          },
          {
            name: 'Contactors & Relays',
            brands: ELECTRICAL_BRANDS,
            types: [
              type(
                'Contactor',
                ['CT', 'KM'],
                ['9 A', '12 A', '18 A', '25 A', '40 A', '65 A', '95 A'],
                [32, 480],
                { demand: 4 },
              ),
              type('Control Relay', ['CR', 'RL'], VOLTAGES, [9, 64], {
                demand: 4,
                weightGramsMin: 20,
                weightGramsMax: 120,
              }),
            ],
          },
          {
            name: 'Power Supplies',
            brands: ELECTRICAL_BRANDS,
            types: [
              type(
                'DIN-Rail Power Supply',
                ['PS', 'PSU'],
                ['24 VDC 2.5 A', '24 VDC 5 A', '24 VDC 10 A', '24 VDC 20 A', '48 VDC 10 A'],
                [68, 620],
                { demand: 4 },
              ),
            ],
          },
          {
            name: 'Transformers',
            brands: ELECTRICAL_BRANDS,
            types: [
              type(
                'Control Transformer',
                ['CTX', 'TX'],
                ['50 VA', '100 VA', '250 VA', '500 VA', '1 kVA', '3 kVA'],
                [46, 1_100],
                { weightGramsMin: 500, weightGramsMax: 25_000 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Wire & Cable',
        children: [
          {
            name: 'Machine Tool Wire',
            brands: ELECTRICAL_BRANDS,
            types: [
              type('MTW Wire', ['MTW', 'THHN'], AWG, [0.18, 2.4], {
                unitOfMeasure: 'FT',
                precision: 0,
                demand: 3,
                weightGramsMin: 5,
                weightGramsMax: 60,
              }),
            ],
          },
          {
            name: 'Control Cable',
            brands: ENCLOSURE_BRANDS,
            types: [
              type(
                'Control Cable',
                ['CC', 'TC'],
                ['4C 18 AWG', '7C 18 AWG', '12C 18 AWG', '4C 16 AWG', '7C 16 AWG'],
                [0.9, 6.2],
                {
                  unitOfMeasure: 'FT',
                  precision: 0,
                  demand: 2,
                  weightGramsMin: 20,
                  weightGramsMax: 150,
                },
              ),
            ],
          },
          {
            name: 'Ethernet Cable',
            brands: ENCLOSURE_BRANDS,
            types: [
              type(
                'Industrial Ethernet Patch Cord',
                ['EC', 'IE'],
                ['0.5 m', '1 m', '2 m', '3 m', '5 m', '10 m'],
                [9, 64],
                { demand: 3, weightGramsMin: 40, weightGramsMax: 600 },
              ),
            ],
          },
          {
            name: 'Servo Cable',
            brands: MOTION_BRANDS,
            types: [
              type(
                'Servo Power Cable',
                ['SPC', 'SFC'],
                ['3 m', '5 m', '10 m', '15 m', '20 m'],
                [64, 410],
                { demand: 2 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Terminals & Connectors',
        children: [
          {
            name: 'Terminal Blocks',
            brands: ELECTRICAL_BRANDS,
            types: [
              type(
                'DIN-Rail Terminal Block',
                ['TB', 'UT'],
                ['2.5 mm²', '4 mm²', '6 mm²', '10 mm²', '16 mm²'],
                [0.9, 8.4],
                {
                  unitOfMeasure: 'PK',
                  precision: 0,
                  demand: 4,
                  weightGramsMin: 100,
                  weightGramsMax: 800,
                },
              ),
            ],
          },
          {
            name: 'M12 Connectors',
            brands: SENSOR_BRANDS,
            types: [
              type(
                'M12 Connector',
                ['M12', 'CN'],
                [
                  '4-pin straight',
                  '4-pin angled',
                  '5-pin straight',
                  '8-pin straight',
                  '12-pin straight',
                ],
                [8, 48],
                { demand: 4, weightGramsMin: 20, weightGramsMax: 80 },
              ),
            ],
          },
          {
            name: 'Sensor Cables',
            brands: SENSOR_BRANDS,
            types: [
              type('Sensor Cordset', ['SC', 'M12C'], ['2 m', '5 m', '10 m'], [12, 68], {
                demand: 4,
                weightGramsMin: 60,
                weightGramsMax: 500,
              }),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Pneumatics & Hydraulics',
    children: [
      {
        name: 'Pneumatic Actuators',
        children: [
          {
            name: 'Pneumatic Cylinders',
            brands: PNEUMATIC_BRANDS,
            types: [
              type('Pneumatic Cylinder', ['PC', 'ISO'], BORE_SIZES, [58, 640], {
                demand: 3,
                weightGramsMin: 300,
                weightGramsMax: 9_000,
              }),
            ],
          },
          {
            name: 'Compact Cylinders',
            brands: PNEUMATIC_BRANDS,
            types: [
              type(
                'Compact Cylinder',
                ['CQ', 'CPC'],
                ['12 mm', '16 mm', '20 mm', '25 mm', '32 mm'],
                [42, 290],
                { demand: 2 },
              ),
            ],
          },
          {
            name: 'Grippers',
            brands: PNEUMATIC_BRANDS,
            types: [
              type(
                'Parallel Gripper',
                ['GR', 'PG'],
                ['16 mm', '20 mm', '25 mm', '32 mm'],
                [160, 1_100],
              ),
            ],
          },
        ],
      },
      {
        name: 'Valves',
        children: [
          {
            name: 'Solenoid Valves',
            brands: PNEUMATIC_BRANDS,
            types: [
              type(
                'Solenoid Valve',
                ['SV', 'VQ'],
                ['3/2 24 VDC', '5/2 24 VDC', '5/3 24 VDC', '5/2 120 VAC'],
                [48, 320],
                { demand: 4 },
              ),
            ],
          },
          {
            name: 'Valve Manifolds',
            brands: PNEUMATIC_BRANDS,
            types: [
              type(
                'Valve Manifold',
                ['VM', 'MF'],
                ['4-station', '6-station', '8-station', '12-station'],
                [240, 1_900],
              ),
            ],
          },
          {
            name: 'Ball Valves',
            brands: FLUID_BRANDS,
            types: [
              type('Brass Ball Valve', ['BV', 'BBV'], PIPE_SIZES, [11, 96], {
                demand: 3,
                weightGramsMin: 100,
                weightGramsMax: 2_500,
              }),
            ],
          },
        ],
      },
      {
        name: 'Air Preparation',
        children: [
          {
            name: 'Filters & Regulators',
            brands: PNEUMATIC_BRANDS,
            types: [
              type('FRL Unit', ['FRL', 'AW'], ['1/4 in', '3/8 in', '1/2 in', '3/4 in'], [64, 380], {
                demand: 2,
              }),
            ],
          },
          {
            name: 'Tubing & Fittings',
            brands: PNEUMATIC_BRANDS,
            types: [
              type(
                'Polyurethane Tubing',
                ['PU', 'TU'],
                ['4 mm', '6 mm', '8 mm', '10 mm', '12 mm'],
                [0.42, 1.9],
                {
                  unitOfMeasure: 'M',
                  precision: 1,
                  demand: 4,
                  weightGramsMin: 10,
                  weightGramsMax: 80,
                },
              ),
              type(
                'Push-to-Connect Fitting',
                ['PF', 'KQ'],
                [
                  '4 mm × 1/8',
                  '6 mm × 1/8',
                  '6 mm × 1/4',
                  '8 mm × 1/4',
                  '10 mm × 3/8',
                  '12 mm × 1/2',
                ],
                [1.6, 9.8],
                { unitOfMeasure: 'PK', demand: 5, weightGramsMin: 50, weightGramsMax: 400 },
              ),
            ],
          },
          {
            name: 'Hydraulic Components',
            brands: PNEUMATIC_BRANDS,
            types: [
              type(
                'Hydraulic Cylinder',
                ['HC', 'HYD'],
                ['2 in bore', '2.5 in bore', '3 in bore', '4 in bore'],
                [340, 2_900],
                { weightGramsMin: 4_000, weightGramsMax: 40_000, leadTimeMin: 10, leadTimeMax: 45 },
              ),
              type('Hydraulic Hose Assembly', ['HH', 'HA'], PIPE_SIZES, [28, 240], { demand: 2 }),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Fasteners & Hardware',
    children: [
      {
        name: 'Bolts & Screws',
        children: [
          {
            name: 'Hex Cap Screws',
            brands: FASTENER_BRANDS,
            types: [
              type(
                'Hex Cap Screw Grade 8',
                ['HCS', 'G8'],
                THREAD_SIZES.map((size) => `${size} × 1 in`),
                [6, 96],
                {
                  unitOfMeasure: 'PK',
                  demand: 5,
                  weightGramsMin: 200,
                  weightGramsMax: 6_000,
                  leadTimeMin: 1,
                  leadTimeMax: 5,
                },
              ),
            ],
          },
          {
            name: 'Socket Head Cap Screws',
            brands: FASTENER_BRANDS,
            types: [
              type(
                'Socket Head Cap Screw',
                ['SHCS', 'SH'],
                THREAD_SIZES.map((size) => `${size} × 25 mm`),
                [8, 120],
                {
                  unitOfMeasure: 'PK',
                  demand: 4,
                  weightGramsMin: 200,
                  weightGramsMax: 6_000,
                  leadTimeMin: 1,
                  leadTimeMax: 5,
                },
              ),
            ],
          },
          {
            name: 'Machine Screws',
            brands: FASTENER_BRANDS,
            types: [
              type(
                'Machine Screw Stainless',
                ['MS', 'SS'],
                ['M3 × 10', 'M4 × 12', 'M5 × 16', 'M6 × 20', '#8-32 × 1/2', '#10-24 × 3/4'],
                [4, 48],
                {
                  unitOfMeasure: 'PK',
                  demand: 3,
                  weightGramsMin: 100,
                  weightGramsMax: 2_000,
                  leadTimeMin: 1,
                  leadTimeMax: 5,
                },
              ),
            ],
          },
        ],
      },
      {
        name: 'Nuts & Washers',
        children: [
          {
            name: 'Hex Nuts',
            brands: FASTENER_BRANDS,
            types: [
              type('Hex Nut Grade 8', ['HN', 'NUT'], THREAD_SIZES, [4, 62], {
                unitOfMeasure: 'PK',
                demand: 4,
                weightGramsMin: 100,
                weightGramsMax: 4_000,
                leadTimeMin: 1,
                leadTimeMax: 5,
              }),
            ],
          },
          {
            name: 'Lock Nuts',
            brands: FASTENER_BRANDS,
            types: [
              type('Nylon Lock Nut', ['NL', 'LN'], THREAD_SIZES, [5, 70], {
                unitOfMeasure: 'PK',
                demand: 3,
                weightGramsMin: 100,
                weightGramsMax: 4_000,
                leadTimeMin: 1,
                leadTimeMax: 5,
              }),
            ],
          },
          {
            name: 'Washers',
            brands: FASTENER_BRANDS,
            types: [
              type('Flat Washer', ['FW', 'WS'], THREAD_SIZES, [3, 42], {
                unitOfMeasure: 'PK',
                demand: 4,
                weightGramsMin: 100,
                weightGramsMax: 4_000,
                leadTimeMin: 1,
                leadTimeMax: 5,
              }),
              type('Split Lock Washer', ['SLW', 'LW'], THREAD_SIZES, [3, 40], {
                unitOfMeasure: 'PK',
                demand: 3,
                weightGramsMin: 100,
                weightGramsMax: 4_000,
                leadTimeMin: 1,
                leadTimeMax: 5,
              }),
            ],
          },
        ],
      },
      {
        name: 'Anchors & Rivets',
        children: [
          {
            name: 'Concrete Anchors',
            brands: FASTENER_BRANDS,
            types: [
              type(
                'Wedge Anchor',
                ['WA', 'CA'],
                ['3/8 × 3 in', '1/2 × 4 in', '5/8 × 5 in', '3/4 × 6 in'],
                [12, 140],
                { unitOfMeasure: 'PK', demand: 2, weightGramsMin: 500, weightGramsMax: 8_000 },
              ),
            ],
          },
          {
            name: 'Rivets',
            brands: FASTENER_BRANDS,
            types: [
              type(
                'Blind Rivet Aluminum',
                ['BR', 'RV'],
                ['1/8 × 1/4', '1/8 × 3/8', '3/16 × 1/4', '3/16 × 1/2', '1/4 × 1/2'],
                [6, 54],
                { unitOfMeasure: 'PK', demand: 2, weightGramsMin: 100, weightGramsMax: 2_000 },
              ),
            ],
          },
          {
            name: 'Threaded Rod',
            brands: FASTENER_BRANDS,
            types: [
              type(
                'Threaded Rod Zinc',
                ['TR', 'ROD'],
                THREAD_SIZES.map((size) => `${size} × 3 ft`),
                [4, 38],
                { demand: 2, weightGramsMin: 300, weightGramsMax: 5_000 },
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Safety',
    children: [
      {
        name: 'Machine Safety',
        children: [
          {
            name: 'Safety Relays',
            brands: SAFETY_BRANDS,
            types: [
              type(
                'Safety Relay',
                ['SR', 'PNOZ'],
                ['2 N.O.', '3 N.O.', '3 N.O. + 1 N.C.', 'Dual channel'],
                [140, 620],
                { demand: 3 },
              ),
            ],
          },
          {
            name: 'Light Curtains',
            brands: SAFETY_BRANDS,
            types: [
              type(
                'Safety Light Curtain',
                ['LC', 'SLC'],
                ['300 mm', '600 mm', '900 mm', '1200 mm', '1800 mm'],
                [680, 3_900],
                { weightGramsMin: 800, weightGramsMax: 6_000, leadTimeMin: 7, leadTimeMax: 30 },
              ),
            ],
          },
          {
            name: 'E-Stops & Interlocks',
            brands: SAFETY_BRANDS,
            types: [
              type(
                'Emergency Stop Operator',
                ['ES', 'ESB'],
                ['22 mm twist release', '22 mm pull release', '30 mm twist release', 'Illuminated'],
                [24, 140],
                { demand: 3, weightGramsMin: 50, weightGramsMax: 300 },
              ),
              type(
                'Safety Interlock Switch',
                ['SIS', 'ILS'],
                ['Mechanical', 'RFID coded', 'Solenoid locking'],
                [96, 720],
                { demand: 2 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Personal Protective Equipment',
        children: [
          {
            name: 'Gloves',
            brands: SAFETY_BRANDS,
            types: [
              type('Cut-Resistant Glove', ['CR', 'A4'], SIZES, [6, 24], {
                unitOfMeasure: 'PK',
                demand: 4,
                weightGramsMin: 200,
                weightGramsMax: 1_200,
                leadTimeMin: 1,
                leadTimeMax: 7,
              }),
            ],
          },
          {
            name: 'Eye Protection',
            brands: SAFETY_BRANDS,
            types: [
              type(
                'Safety Glasses',
                ['SG', 'Z87'],
                ['Clear', 'Smoke', 'Amber', 'Anti-fog clear'],
                [3, 18],
                {
                  unitOfMeasure: 'PK',
                  demand: 4,
                  weightGramsMin: 100,
                  weightGramsMax: 800,
                  leadTimeMin: 1,
                  leadTimeMax: 7,
                },
              ),
            ],
          },
          {
            name: 'Hearing Protection',
            brands: SAFETY_BRANDS,
            types: [
              type('Foam Earplug', ['EP', 'NRR'], ['NRR 29', 'NRR 32', 'NRR 33 corded'], [8, 42], {
                unitOfMeasure: 'PK',
                demand: 3,
                weightGramsMin: 100,
                weightGramsMax: 900,
              }),
            ],
          },
          {
            name: 'Hard Hats',
            brands: SAFETY_BRANDS,
            types: [
              type(
                'Hard Hat Type I',
                ['HH', 'T1'],
                ['White', 'Yellow', 'Orange', 'Blue', 'Hi-vis green'],
                [11, 46],
                { demand: 2 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Facility Safety',
        children: [
          {
            name: 'Lockout / Tagout',
            brands: SAFETY_BRANDS,
            types: [
              type(
                'Lockout Padlock',
                ['LO', 'LOTO'],
                ['Red', 'Blue', 'Yellow', 'Green', 'Keyed alike set'],
                [7, 96],
                { demand: 2 },
              ),
              type(
                'Circuit Breaker Lockout',
                ['CBL', 'BL'],
                ['Universal', 'Miniature', 'Tie-bar'],
                [9, 38],
              ),
            ],
          },
          {
            name: 'Spill Control',
            brands: MRO_BRANDS,
            types: [
              type(
                'Absorbent Pad',
                ['AP', 'OIL'],
                ['Oil-only 100 ct', 'Universal 100 ct', 'Hazmat 50 ct'],
                [42, 130],
                { unitOfMeasure: 'PK', demand: 2, weightGramsMin: 4_000, weightGramsMax: 12_000 },
              ),
            ],
          },
          {
            name: 'Signs & Labels',
            brands: MRO_BRANDS,
            types: [
              type(
                'Safety Sign',
                ['SS', 'SIGN'],
                ['Danger', 'Warning', 'Caution', 'Notice'],
                [9, 48],
                { demand: 2, weightGramsMin: 100, weightGramsMax: 900 },
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Cutting Tools & Abrasives',
    children: [
      {
        name: 'Cutting Tools',
        children: [
          {
            name: 'End Mills',
            brands: TOOL_BRANDS,
            types: [
              type(
                'Carbide End Mill 4-Flute',
                ['EM', 'CEM'],
                ['1/8 in', '3/16 in', '1/4 in', '3/8 in', '1/2 in', '3/4 in'],
                [14, 140],
                {
                  demand: 3,
                  weightGramsMin: 20,
                  weightGramsMax: 400,
                  leadTimeMin: 1,
                  leadTimeMax: 7,
                },
              ),
            ],
          },
          {
            name: 'Drill Bits',
            brands: TOOL_BRANDS,
            types: [
              type(
                'Cobalt Jobber Drill',
                ['DB', 'CJD'],
                ['1/8 in', '3/16 in', '1/4 in', '5/16 in', '3/8 in', '1/2 in'],
                [4, 46],
                {
                  demand: 4,
                  weightGramsMin: 10,
                  weightGramsMax: 300,
                  leadTimeMin: 1,
                  leadTimeMax: 7,
                },
              ),
            ],
          },
          {
            name: 'Inserts',
            brands: TOOL_BRANDS,
            types: [
              type(
                'Carbide Turning Insert',
                ['CNMG', 'WNMG', 'DNMG'],
                ['432', '431', '433', '542'],
                [48, 190],
                { unitOfMeasure: 'PK', demand: 3, weightGramsMin: 50, weightGramsMax: 300 },
              ),
            ],
          },
          {
            name: 'Taps & Dies',
            brands: TOOL_BRANDS,
            types: [
              type('Spiral Point Tap', ['TP', 'SPT'], THREAD_SIZES, [9, 74], {
                demand: 2,
                weightGramsMin: 20,
                weightGramsMax: 300,
              }),
            ],
          },
        ],
      },
      {
        name: 'Abrasives',
        children: [
          {
            name: 'Grinding Wheels',
            brands: TOOL_BRANDS,
            types: [
              type(
                'Grinding Wheel Type 27',
                ['GW', 'T27'],
                ['4.5 × 1/4 in', '5 × 1/4 in', '7 × 1/4 in', '9 × 1/4 in'],
                [2.4, 14],
                { unitOfMeasure: 'PK', demand: 3, weightGramsMin: 500, weightGramsMax: 4_000 },
              ),
            ],
          },
          {
            name: 'Cut-off Wheels',
            brands: TOOL_BRANDS,
            types: [
              type(
                'Cut-off Wheel Type 1',
                ['CW', 'T1'],
                ['3 × 1/16 in', '4.5 × 0.045 in', '6 × 0.045 in', '14 × 3/32 in'],
                [1.8, 12],
                { unitOfMeasure: 'PK', demand: 3, weightGramsMin: 300, weightGramsMax: 5_000 },
              ),
            ],
          },
          {
            name: 'Sanding Discs',
            brands: TOOL_BRANDS,
            types: [
              type(
                'Flap Disc Zirconia',
                ['FD', 'ZFD'],
                [
                  '4.5 in 40 grit',
                  '4.5 in 60 grit',
                  '4.5 in 80 grit',
                  '7 in 40 grit',
                  '7 in 60 grit',
                ],
                [3.2, 18],
                { unitOfMeasure: 'PK', demand: 3, weightGramsMin: 400, weightGramsMax: 3_000 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Hand & Power Tools',
        children: [
          {
            name: 'Hand Tools',
            brands: TOOL_BRANDS,
            types: [
              type(
                'Combination Wrench Set',
                ['WS', 'CWS'],
                ['SAE 10 pc', 'Metric 12 pc', 'SAE/Metric 24 pc'],
                [38, 240],
                { demand: 2, weightGramsMin: 800, weightGramsMax: 5_000 },
              ),
              type(
                'Torque Wrench',
                ['TW', 'CTW'],
                ['1/4 in drive', '3/8 in drive', '1/2 in drive', '3/4 in drive'],
                [64, 420],
              ),
            ],
          },
          {
            name: 'Power Tools',
            brands: TOOL_BRANDS,
            types: [
              type(
                'Cordless Drill Driver',
                ['CD', 'DD'],
                ['18 V compact', '18 V brushless', '20 V hammer'],
                [110, 380],
                { weightGramsMin: 1_200, weightGramsMax: 3_000 },
              ),
              type(
                'Angle Grinder',
                ['AG', 'GR'],
                ['4.5 in corded', '4.5 in cordless', '7 in corded'],
                [78, 310],
              ),
            ],
          },
          {
            name: 'Measuring Tools',
            brands: TOOL_BRANDS,
            types: [
              type('Digital Caliper', ['DC', 'CAL'], ['6 in', '8 in', '12 in'], [42, 380], {
                demand: 2,
                weightGramsMin: 200,
                weightGramsMax: 900,
              }),
              type(
                'Micrometer',
                ['MM', 'MIC'],
                ['0–1 in', '1–2 in', '0–25 mm', '25–50 mm'],
                [56, 460],
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Material Handling',
    children: [
      {
        name: 'Storage',
        children: [
          {
            name: 'Pallet Racking',
            brands: HANDLING_BRANDS,
            types: [
              type(
                'Pallet Rack Upright',
                ['PR', 'UP'],
                ['8 ft × 42 in', '10 ft × 42 in', '12 ft × 42 in', '16 ft × 42 in'],
                [140, 480],
                {
                  weightGramsMin: 20_000,
                  weightGramsMax: 60_000,
                  leadTimeMin: 10,
                  leadTimeMax: 35,
                },
              ),
              type(
                'Pallet Rack Beam',
                ['PB', 'BM'],
                ['96 in', '108 in', '120 in', '144 in'],
                [42, 160],
                { demand: 2, weightGramsMin: 8_000, weightGramsMax: 25_000 },
              ),
            ],
          },
          {
            name: 'Shelving',
            brands: HANDLING_BRANDS,
            types: [
              type(
                'Wire Shelving Unit',
                ['WS', 'SH'],
                ['36 × 18 × 72 in', '48 × 18 × 72 in', '48 × 24 × 72 in', '60 × 24 × 86 in'],
                [110, 420],
                { weightGramsMin: 15_000, weightGramsMax: 45_000 },
              ),
            ],
          },
          {
            name: 'Bins & Totes',
            brands: HANDLING_BRANDS,
            types: [
              type(
                'Stackable Bin',
                ['SB', 'BIN'],
                ['4 × 5 in', '7 × 4 in', '11 × 5 in', '15 × 8 in', '18 × 11 in'],
                [1.4, 24],
                { unitOfMeasure: 'PK', demand: 4, weightGramsMin: 500, weightGramsMax: 12_000 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Lifting & Moving',
        children: [
          {
            name: 'Pallet Jacks',
            brands: HANDLING_BRANDS,
            types: [
              type(
                'Manual Pallet Jack',
                ['PJ', 'MPJ'],
                ['5,500 lb 27 × 48 in', '5,500 lb 21 × 48 in', 'Low profile 21 × 36 in'],
                [290, 720],
                { weightGramsMin: 60_000, weightGramsMax: 90_000 },
              ),
              type(
                'Electric Pallet Jack',
                ['EPJ', 'EP'],
                ['3,300 lb', '4,500 lb'],
                [2_400, 5_800],
                {
                  leadTimeMin: 14,
                  leadTimeMax: 45,
                  weightGramsMin: 120_000,
                  weightGramsMax: 250_000,
                },
              ),
            ],
          },
          {
            name: 'Hoists & Slings',
            brands: HANDLING_BRANDS,
            types: [
              type(
                'Chain Hoist',
                ['CH', 'HST'],
                ['1/2 ton', '1 ton', '2 ton', '3 ton'],
                [180, 1_400],
              ),
              type(
                'Polyester Web Sling',
                ['WSL', 'SL'],
                ['2 in × 4 ft', '2 in × 6 ft', '3 in × 8 ft', '4 in × 10 ft'],
                [12, 74],
                { demand: 2 },
              ),
            ],
          },
          {
            name: 'Carts & Dollies',
            brands: HANDLING_BRANDS,
            types: [
              type(
                'Steel Platform Truck',
                ['PT', 'CART'],
                ['24 × 48 in', '30 × 60 in', '36 × 72 in'],
                [160, 560],
                { weightGramsMin: 25_000, weightGramsMax: 60_000 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Packaging',
        children: [
          {
            name: 'Stretch Film',
            brands: MRO_BRANDS,
            types: [
              type(
                'Stretch Film Roll',
                ['SF', 'FILM'],
                ['18 in × 1500 ft 80 ga', '20 in × 1000 ft 90 ga', '18 in × 1500 ft 63 ga'],
                [14, 34],
                {
                  unitOfMeasure: 'PK',
                  demand: 4,
                  weightGramsMin: 3_000,
                  weightGramsMax: 20_000,
                  leadTimeMin: 1,
                  leadTimeMax: 5,
                },
              ),
            ],
          },
          {
            name: 'Tape & Strapping',
            brands: MRO_BRANDS,
            types: [
              type(
                'Carton Sealing Tape',
                ['CT', 'TAPE'],
                ['2 in × 110 yd clear', '2 in × 110 yd tan', '3 in × 110 yd clear'],
                [22, 68],
                {
                  unitOfMeasure: 'PK',
                  demand: 4,
                  weightGramsMin: 4_000,
                  weightGramsMax: 16_000,
                  leadTimeMin: 1,
                  leadTimeMax: 5,
                },
              ),
            ],
          },
          {
            name: 'Corrugated Boxes',
            brands: MRO_BRANDS,
            types: [
              type(
                'RSC Corrugated Box',
                ['BX', 'RSC'],
                ['12 × 12 × 12 in', '16 × 12 × 8 in', '18 × 18 × 16 in', '24 × 18 × 12 in'],
                [18, 96],
                {
                  unitOfMeasure: 'PK',
                  demand: 3,
                  weightGramsMin: 5_000,
                  weightGramsMax: 30_000,
                  leadTimeMin: 1,
                  leadTimeMax: 7,
                },
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Enclosures & Cable Management',
    children: [
      {
        name: 'Enclosures',
        children: [
          {
            name: 'Steel Enclosures',
            brands: ENCLOSURE_BRANDS,
            types: [
              type(
                'NEMA 12 Wall-Mount Enclosure',
                ['EN', 'N12'],
                [
                  '16 × 12 × 6 in',
                  '20 × 16 × 8 in',
                  '24 × 20 × 8 in',
                  '30 × 24 × 10 in',
                  '36 × 30 × 12 in',
                ],
                [180, 1_600],
                { weightGramsMin: 6_000, weightGramsMax: 50_000, leadTimeMin: 5, leadTimeMax: 21 },
              ),
            ],
          },
          {
            name: 'Polycarbonate Enclosures',
            brands: ENCLOSURE_BRANDS,
            types: [
              type(
                'Polycarbonate Enclosure',
                ['PE', 'PCE'],
                ['6 × 6 × 4 in', '8 × 8 × 4 in', '12 × 10 × 6 in', '16 × 14 × 7 in'],
                [46, 380],
                { demand: 2 },
              ),
            ],
          },
          {
            name: 'Enclosure Climate Control',
            brands: ENCLOSURE_BRANDS,
            types: [
              type(
                'Enclosure Fan Kit',
                ['EF', 'FAN'],
                ['4 in 115 V', '4 in 24 VDC', '6 in 115 V', '10 in 115 V'],
                [42, 260],
                { demand: 2 },
              ),
              type(
                'Enclosure Air Conditioner',
                ['EAC', 'AC'],
                ['1,000 BTU', '2,000 BTU', '4,000 BTU', '6,000 BTU'],
                [1_100, 4_900],
                { leadTimeMin: 10, leadTimeMax: 35 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Cable Management',
        children: [
          {
            name: 'Wire Duct',
            brands: ENCLOSURE_BRANDS,
            types: [
              type(
                'Slotted Wire Duct',
                ['WD', 'SWD'],
                ['1 × 1 in', '1 × 2 in', '2 × 2 in', '2 × 3 in', '3 × 3 in', '4 × 4 in'],
                [9, 48],
                { demand: 3, weightGramsMin: 300, weightGramsMax: 2_000 },
              ),
            ],
          },
          {
            name: 'Cable Carriers',
            brands: MOTION_BRANDS,
            types: [
              type(
                'Cable Carrier',
                ['CC', 'ECH'],
                ['15 × 30 mm', '25 × 50 mm', '38 × 75 mm', '50 × 100 mm'],
                [1.8, 12],
                { unitOfMeasure: 'M', precision: 1, demand: 2 },
              ),
            ],
          },
          {
            name: 'Cable Ties & Glands',
            brands: ENCLOSURE_BRANDS,
            types: [
              type(
                'Nylon Cable Tie',
                ['NT', 'TIE'],
                ['4 in 18 lb', '8 in 50 lb', '11 in 50 lb', '14 in 120 lb'],
                [4, 38],
                {
                  unitOfMeasure: 'PK',
                  demand: 5,
                  weightGramsMin: 100,
                  weightGramsMax: 2_000,
                  leadTimeMin: 1,
                  leadTimeMax: 5,
                },
              ),
              type('Cable Gland', ['CG', 'PG'], ['M12', 'M16', 'M20', 'M25', 'M32'], [0.8, 6.4], {
                unitOfMeasure: 'PK',
                demand: 3,
                weightGramsMin: 100,
                weightGramsMax: 1_000,
              }),
            ],
          },
          {
            name: 'DIN Rail',
            brands: ENCLOSURE_BRANDS,
            types: [
              type(
                'DIN Rail 35 mm',
                ['DR', 'DIN'],
                ['1 m slotted', '2 m slotted', '1 m solid', '2 m solid'],
                [4, 18],
                { demand: 3, weightGramsMin: 300, weightGramsMax: 1_200 },
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Fluid Handling',
    children: [
      {
        name: 'Pumps',
        children: [
          {
            name: 'Centrifugal Pumps',
            brands: FLUID_BRANDS,
            types: [
              type('Centrifugal Pump', ['CP', 'CEN'], HP_RATINGS.slice(0, 7), [640, 5_800], {
                weightGramsMin: 10_000,
                weightGramsMax: 90_000,
                leadTimeMin: 10,
                leadTimeMax: 42,
              }),
            ],
          },
          {
            name: 'Diaphragm Pumps',
            brands: FLUID_BRANDS,
            types: [
              type(
                'Air-Operated Diaphragm Pump',
                ['DP', 'AOD'],
                PIPE_SIZES.slice(2),
                [420, 3_200],
                { leadTimeMin: 7, leadTimeMax: 28 },
              ),
            ],
          },
          {
            name: 'Metering Pumps',
            brands: FLUID_BRANDS,
            types: [
              type(
                'Metering Pump',
                ['MP', 'DOS'],
                ['0.5 GPH', '1 GPH', '3 GPH', '10 GPH'],
                [360, 2_100],
              ),
            ],
          },
        ],
      },
      {
        name: 'Hose & Fittings',
        children: [
          {
            name: 'Industrial Hose',
            brands: FLUID_BRANDS,
            types: [
              type('PVC Suction Hose', ['SH', 'PVC'], PIPE_SIZES.slice(2), [3.2, 24], {
                unitOfMeasure: 'FT',
                demand: 2,
                weightGramsMin: 200,
                weightGramsMax: 1_500,
              }),
            ],
          },
          {
            name: 'Camlock Fittings',
            brands: FLUID_BRANDS,
            types: [
              type(
                'Camlock Coupling Aluminum',
                ['CL', 'CAM'],
                [
                  'Type A 1 in',
                  'Type B 1 in',
                  'Type C 2 in',
                  'Type D 2 in',
                  'Type E 3 in',
                  'Type F 3 in',
                ],
                [6, 48],
                { demand: 3 },
              ),
            ],
          },
          {
            name: 'Pipe Fittings',
            brands: FLUID_BRANDS,
            types: [
              type(
                'Stainless Pipe Fitting',
                ['PF', 'SSF'],
                PIPE_SIZES.map((size) => `${size} elbow`),
                [3, 46],
                { unitOfMeasure: 'PK', demand: 3, weightGramsMin: 200, weightGramsMax: 3_000 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Filtration',
        children: [
          {
            name: 'Filter Cartridges',
            brands: FLUID_BRANDS,
            types: [
              type(
                'Sediment Filter Cartridge',
                ['FC', 'SED'],
                ['5 micron 10 in', '20 micron 10 in', '5 micron 20 in', '50 micron 20 in'],
                [8, 64],
                { unitOfMeasure: 'PK', demand: 3, weightGramsMin: 300, weightGramsMax: 3_000 },
              ),
            ],
          },
          {
            name: 'Strainers',
            brands: FLUID_BRANDS,
            types: [type('Y-Strainer', ['YS', 'STR'], PIPE_SIZES, [24, 380], { demand: 2 })],
          },
        ],
      },
    ],
  },
  {
    name: 'Bearings & Power Transmission',
    children: [
      {
        name: 'Bearings',
        children: [
          {
            name: 'Ball Bearings',
            brands: BEARING_BRANDS,
            types: [
              type(
                'Deep Groove Ball Bearing',
                ['6200', '6300', '6000'],
                ['2RS', 'ZZ', 'Open'],
                [4, 96],
                {
                  demand: 5,
                  weightGramsMin: 20,
                  weightGramsMax: 1_500,
                  leadTimeMin: 1,
                  leadTimeMax: 7,
                },
              ),
            ],
          },
          {
            name: 'Mounted Bearings',
            brands: BEARING_BRANDS,
            types: [
              type(
                'Pillow Block Bearing',
                ['PB', 'UCP'],
                ['1/2 in', '3/4 in', '1 in', '1-1/4 in', '1-1/2 in', '2 in'],
                [14, 190],
                { demand: 3, weightGramsMin: 300, weightGramsMax: 6_000 },
              ),
            ],
          },
          {
            name: 'Roller Bearings',
            brands: BEARING_BRANDS,
            types: [
              type(
                'Tapered Roller Bearing',
                ['TR', 'TRB'],
                ['25 mm', '30 mm', '40 mm', '50 mm', '60 mm'],
                [18, 320],
                { demand: 2 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Belts & Chains',
        children: [
          {
            name: 'V-Belts',
            brands: BEARING_BRANDS,
            types: [
              type(
                'V-Belt',
                ['A', 'B', '3V', '5V'],
                ['A38', 'A46', 'B52', 'B68', '3V450', '5V750'],
                [8, 86],
                {
                  demand: 4,
                  weightGramsMin: 100,
                  weightGramsMax: 1_200,
                  leadTimeMin: 1,
                  leadTimeMax: 7,
                },
              ),
            ],
          },
          {
            name: 'Timing Belts',
            brands: BEARING_BRANDS,
            types: [
              type(
                'Timing Belt HTD',
                ['TB', 'HTD'],
                ['5M-15 mm', '5M-25 mm', '8M-20 mm', '8M-30 mm', '14M-40 mm'],
                [12, 160],
                { demand: 3 },
              ),
            ],
          },
          {
            name: 'Roller Chain',
            brands: BEARING_BRANDS,
            types: [
              type(
                'Roller Chain ANSI',
                ['RC', 'ANSI'],
                ['#35 10 ft', '#40 10 ft', '#50 10 ft', '#60 10 ft', '#80 10 ft'],
                [22, 240],
                { demand: 3, weightGramsMin: 1_000, weightGramsMax: 12_000 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Gearboxes & Sprockets',
        children: [
          {
            name: 'Worm Gearboxes',
            brands: BEARING_BRANDS,
            types: [
              type(
                'Worm Gear Reducer',
                ['WG', 'NMRV'],
                ['10:1', '20:1', '30:1', '40:1', '60:1', '80:1'],
                [96, 1_100],
                { weightGramsMin: 2_000, weightGramsMax: 30_000, leadTimeMin: 5, leadTimeMax: 28 },
              ),
            ],
          },
          {
            name: 'Sprockets',
            brands: BEARING_BRANDS,
            types: [
              type(
                'Finished Bore Sprocket',
                ['SP', 'SPK'],
                ['#40 12T', '#40 18T', '#50 15T', '#50 24T', '#60 18T', '#80 20T'],
                [9, 120],
                { demand: 3 },
              ),
            ],
          },
          {
            name: 'Pulleys & Sheaves',
            brands: BEARING_BRANDS,
            types: [
              type(
                'V-Belt Sheave',
                ['SH', 'AK'],
                [
                  '1 groove 3 in',
                  '1 groove 4 in',
                  '2 groove 5 in',
                  '2 groove 6 in',
                  '3 groove 8 in',
                ],
                [14, 240],
                { demand: 2 },
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'MRO Consumables',
    children: [
      {
        name: 'Lubricants & Chemicals',
        children: [
          {
            name: 'Grease',
            brands: MRO_BRANDS,
            types: [
              type(
                'Lithium EP Grease',
                ['GR', 'EP2'],
                ['14 oz cartridge', '35 lb pail', '120 lb keg'],
                [6, 320],
                {
                  demand: 4,
                  weightGramsMin: 400,
                  weightGramsMax: 60_000,
                  leadTimeMin: 1,
                  leadTimeMax: 5,
                },
              ),
            ],
          },
          {
            name: 'Hydraulic Oil',
            brands: MRO_BRANDS,
            types: [
              type(
                'Hydraulic Oil AW',
                ['AW', 'HO'],
                ['ISO 32 5 gal', 'ISO 46 5 gal', 'ISO 68 5 gal', 'ISO 46 55 gal'],
                [48, 780],
                { demand: 3, weightGramsMin: 18_000, weightGramsMax: 200_000 },
              ),
            ],
          },
          {
            name: 'Cleaners & Degreasers',
            brands: MRO_BRANDS,
            types: [
              type(
                'Industrial Degreaser',
                ['DG', 'CLN'],
                ['1 gal', '5 gal', 'Aerosol 12 pk'],
                [18, 140],
                { demand: 3, weightGramsMin: 4_000, weightGramsMax: 22_000 },
              ),
            ],
          },
        ],
      },
      {
        name: 'Janitorial',
        children: [
          {
            name: 'Wipers & Towels',
            brands: MRO_BRANDS,
            types: [
              type(
                'Shop Towel Roll',
                ['ST', 'WPR'],
                ['Blue 200 ct', 'White 400 ct', 'Heavy duty 100 ct'],
                [12, 48],
                {
                  unitOfMeasure: 'PK',
                  demand: 4,
                  weightGramsMin: 2_000,
                  weightGramsMax: 12_000,
                  leadTimeMin: 1,
                  leadTimeMax: 5,
                },
              ),
            ],
          },
          {
            name: 'Trash Liners',
            brands: MRO_BRANDS,
            types: [
              type(
                'Trash Liner',
                ['TL', 'LNR'],
                ['33 gal 100 ct', '45 gal 100 ct', '55 gal 100 ct'],
                [22, 64],
                { unitOfMeasure: 'PK', demand: 3, weightGramsMin: 4_000, weightGramsMax: 15_000 },
              ),
            ],
          },
          {
            name: 'Floor Care',
            brands: MRO_BRANDS,
            types: [
              type('Floor Squeegee', ['FS', 'SQ'], ['18 in', '24 in', '36 in'], [14, 48], {
                demand: 1,
              }),
            ],
          },
        ],
      },
      {
        name: 'Welding',
        children: [
          {
            name: 'Welding Wire',
            brands: TOOL_BRANDS,
            types: [
              type(
                'MIG Wire ER70S-6',
                ['MW', 'ER70'],
                ['0.030 in 11 lb', '0.035 in 11 lb', '0.035 in 33 lb', '0.045 in 44 lb'],
                [28, 190],
                { demand: 3, weightGramsMin: 5_000, weightGramsMax: 20_000 },
              ),
            ],
          },
          {
            name: 'Welding Consumables',
            brands: TOOL_BRANDS,
            types: [
              type(
                'MIG Contact Tip',
                ['CT', 'TIP'],
                ['0.030 in 25 pk', '0.035 in 25 pk', '0.045 in 25 pk'],
                [9, 32],
                { unitOfMeasure: 'PK', demand: 3, weightGramsMin: 100, weightGramsMax: 400 },
              ),
            ],
          },
          {
            name: 'Welding Safety',
            brands: SAFETY_BRANDS,
            types: [
              type(
                'Welding Helmet Auto-Darkening',
                ['WH', 'ADF'],
                ['Shade 9–13', 'Shade 5–13 large view'],
                [64, 420],
                { demand: 1 },
              ),
            ],
          },
        ],
      },
    ],
  },
];

export interface FlatLeaf {
  path: string[];
  definition: LeafCategoryDefinition;
}

export function flattenLeaves(tree: readonly CategoryDefinition[] = CATEGORY_TREE): FlatLeaf[] {
  const leaves: FlatLeaf[] = [];
  const walk = (node: CategoryDefinition | LeafCategoryDefinition, path: string[]): void => {
    const nextPath = [...path, node.name];
    if (isLeaf(node)) {
      leaves.push({ path: nextPath, definition: node });
      return;
    }
    for (const child of node.children) walk(child, nextPath);
  };
  for (const root of tree) walk(root, []);
  return leaves;
}
