# 🎨 MagicSprite - Image to Fusbead Pattern Converter

A sprite-to-fusebead conversion tool that transforms pixel art into bead patterns and shows how the sprite would actually look using real bead colours.
Features color adjustment tools, inventory tracking, and batch processing capabilities to streamline the bead sprite creation workflow. Includes post generation editing.

## ✨ Features

### 🔄 Smart Image Processing
- Intelligent sprite-to-bead pattern conversion
- Automatic whitespace trimming
- Optional 2x downscaling for upscaled sprites
- Transparent background preservation
- Advanced color adjustment tools

### 🎨 Color Controls
- Pre-conversion color adjustments
- Target specific color groups (reds, blues, etc.)
- Global saturation and brightness controls
- Real-time adjustment previews

### 📐 Precise Editing
- Interactive bead grid editor
- Individual bead color overrides
- Bulk color replacement tools
- Adjustable zoom levels (24px to 96px per bead)
- Live preview updates

### 📦 Inventory Management
- (Currently only supports Arktal C, 2.6mm hard beads)
- Track your bead quantities
- Get shortage warnings
- See exactly how many beads you need
- Pre-loaded with standard bead colors

### 🔍 Batch Analysis
- Process multiple sprites at once
- Get accuracy scores for each conversion
- Sort by conversion quality
- Smart color palette suggestions

## 🚀 Getting Started

1. Clone the repo
```bash
git clone https://github.com/thecaligula/magicsprite.git
cd magicsprite
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

## 🛠️ Tech Stack

- React + Vite
- Tailwind CSS
- Canvas API for image processing

## 🤝 Contributing

Found a bug? Have a cool idea? Feel free to:
- Open an issue
- Submit a pull request
