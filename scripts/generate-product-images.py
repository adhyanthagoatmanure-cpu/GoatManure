import os

OUT = "/home/claude/adhyantha/public/images/products"

def bag_svg(bag_color, bag_dark, label_text="ADHYANTHA", canopy="#2B4C1F", bronze="#A15C1E", gold="#C9A227", parchment="#FAF6EC"):
    return f'''<svg viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ADHYANTHA fertilizer bag">
  <ellipse cx="200" cy="440" rx="130" ry="18" fill="#2A2A22" opacity="0.08"/>
  <path d="M120 70 Q200 30 280 70 L272 110 Q200 82 128 110 Z" fill="{bag_dark}"/>
  <path d="M128 108 L272 108 L296 400 Q296 424 272 424 L128 424 Q104 424 104 400 Z" fill="{bag_color}"/>
  <path d="M128 108 L152 108 L158 424 L128 424 Q104 424 104 400 Z" fill="#000" opacity="0.06"/>
  <path d="M272 108 L248 108 L242 424 L272 424 Q296 424 296 400 Z" fill="#000" opacity="0.06"/>
  <path d="M118 130 L282 130" stroke="#000" stroke-opacity="0.12" stroke-width="2" stroke-dasharray="4 5"/>
  <rect x="150" y="180" width="100" height="100" rx="8" fill="{parchment}"/>
  <circle cx="200" cy="215" r="26" fill="none" stroke="{gold}" stroke-width="3"/>
  <path d="M188 208 Q192 195 200 195 Q208 195 212 208 Q214 214 210 222 L200 232 L190 222 Q186 214 188 208 Z" fill="{bronze}"/>
  <path d="M178 236 L200 250 L222 236 L200 244 Z" fill="{canopy}"/>
  <text x="200" y="268" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="1" fill="{canopy}" font-family="Arial, sans-serif">{label_text}</text>
  <rect x="164" y="320" width="72" height="28" rx="14" fill="#00000010"/>
</svg>'''

def label_detail_svg(bag_color, canopy="#2B4C1F", bronze="#A15C1E", gold="#C9A227", parchment="#FAF6EC"):
    return f'''<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ADHYANTHA label detail">
  <rect width="400" height="400" fill="{bag_color}"/>
  <rect x="60" y="60" width="280" height="280" rx="16" fill="{parchment}"/>
  <circle cx="200" cy="165" r="70" fill="none" stroke="{gold}" stroke-width="6"/>
  <path d="M165 150 Q175 110 200 110 Q225 110 235 150 Q240 168 228 188 L200 215 L172 188 Q160 168 165 150 Z" fill="{bronze}"/>
  <path d="M140 225 L200 260 L260 225 L200 245 Z" fill="{canopy}"/>
  <text x="200" y="305" text-anchor="middle" font-size="26" font-weight="700" letter-spacing="1.5" fill="{canopy}" font-family="Georgia, serif">ADHYANTHA</text>
  <text x="200" y="328" text-anchor="middle" font-size="13" letter-spacing="2" fill="{bronze}" font-family="Arial, sans-serif">100% ORGANIC</text>
</svg>'''

def lifestyle_svg(bag_color, bag_dark, canopy="#2B4C1F", canopy_dark="#1C3314", bronze="#A15C1E", gold="#C9A227", parchment="#FAF6EC"):
    return f'''<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ADHYANTHA bag in a garden setting">
  <rect width="400" height="400" fill="{parchment}"/>
  <path d="M0 300 Q100 270 200 295 T400 285 V400 H0 Z" fill="{canopy_dark}"/>
  <path d="M0 320 Q100 300 200 318 T400 312 V400 H0 Z" fill="{canopy}" opacity="0.6"/>
  <g transform="translate(140,120) scale(0.55)">
    <path d="M120 70 Q200 30 280 70 L272 110 Q200 82 128 110 Z" fill="{bag_dark}"/>
    <path d="M128 108 L272 108 L296 400 Q296 424 272 424 L128 424 Q104 424 104 400 Z" fill="{bag_color}"/>
    <rect x="150" y="180" width="100" height="100" rx="8" fill="{parchment}"/>
    <circle cx="200" cy="215" r="26" fill="none" stroke="{gold}" stroke-width="3"/>
    <path d="M188 208 Q192 195 200 195 Q208 195 212 208 Q214 214 210 222 L200 232 L190 222 Q186 214 188 208 Z" fill="{bronze}"/>
  </g>
  <path d="M40 340 Q55 300 75 340" fill="none" stroke="{canopy}" stroke-width="4" stroke-linecap="round"/>
  <path d="M330 350 Q345 305 365 350" fill="none" stroke="{canopy}" stroke-width="4" stroke-linecap="round"/>
  <path d="M300 360 Q312 320 328 360" fill="none" stroke="{canopy}" stroke-width="4" stroke-linecap="round"/>
</svg>'''

products = {
    "organic-goat-manure-fertilizer": dict(bag_color="#C7A46B", bag_dark="#AD8752"),
    "vermicompost-organic-fertilizer": dict(bag_color="#7A6248", bag_dark="#5F4B36"),
    "neem-cake-organic-fertilizer": dict(bag_color="#BCA75C", bag_dark="#A08F49"),
}

for slug, colors in products.items():
    with open(f"{OUT}/{slug}-front.svg", "w") as f:
        f.write(bag_svg(colors["bag_color"], colors["bag_dark"]))
    with open(f"{OUT}/{slug}-label.svg", "w") as f:
        f.write(label_detail_svg(colors["bag_color"]))
    with open(f"{OUT}/{slug}-lifestyle.svg", "w") as f:
        f.write(lifestyle_svg(colors["bag_color"], colors["bag_dark"]))

print("Generated:", os.listdir(OUT))
