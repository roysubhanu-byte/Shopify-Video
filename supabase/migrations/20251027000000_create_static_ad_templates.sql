/*
  # Static Ad Templates Library - 100 Branded Style Templates

  ## Overview
  This migration creates a curated library of 100 proven ad style templates inspired by
  top global brands. Each template captures a distinct visual language that can be applied
  to any product for static image generation.

  ## Tables Created
  - `static_ad_templates` - Curated brand-style templates with visual parameters

  ## Template Categories
  1. Athletic/Sports (15 templates) - Nike, Adidas, Under Armour style
  2. Tech/Innovation (15 templates) - Apple, Tesla, Samsung style
  3. Luxury/Premium (15 templates) - Chanel, Louis Vuitton, Rolex style
  4. Food/Beverage (15 templates) - Coca-Cola, Starbucks, McDonald's style
  5. Fashion/Lifestyle (15 templates) - Zara, H&M, Supreme style
  6. Beauty/Wellness (10 templates) - Glossier, Sephora, Lush style
  7. Automotive (10 templates) - BMW, Mercedes, Tesla style
  8. Minimal/Clean (5 templates) - Muji, Uniqlo, Everlane style

  ## Template Structure
  Each template includes:
  - Visual style parameters (layout, colors, typography)
  - Mood and composition guidelines
  - Text overlay positioning
  - Background treatment
  - Best use cases

  ## Security
  - Templates are publicly readable (no RLS needed)
  - Used for automated static image generation
*/

-- Create static_ad_templates table
CREATE TABLE IF NOT EXISTS static_ad_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL UNIQUE,
  category text NOT NULL,
  brand_inspiration text NOT NULL,
  layout_type text NOT NULL,
  color_scheme text NOT NULL,
  typography_style text NOT NULL,
  composition_rule text NOT NULL,
  mood_keywords text[] NOT NULL,
  text_overlay_position text NOT NULL,
  background_treatment text NOT NULL,
  best_for_products text[] NOT NULL,
  style_intensity int CHECK (style_intensity BETWEEN 1 AND 10) DEFAULT 7,
  engagement_score int CHECK (engagement_score BETWEEN 1 AND 100) DEFAULT 75,
  prompt_template text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS static_ad_templates_category_idx ON static_ad_templates(category);
CREATE INDEX IF NOT EXISTS static_ad_templates_engagement_idx ON static_ad_templates(engagement_score DESC);

ALTER TABLE static_ad_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are publicly readable"
  ON static_ad_templates FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- SEED STATIC AD TEMPLATES (100 Templates)
-- ============================================================================

-- ATHLETIC/SPORTS TEMPLATES (15)
INSERT INTO static_ad_templates (template_name, category, brand_inspiration, layout_type, color_scheme, typography_style, composition_rule, mood_keywords, text_overlay_position, background_treatment, best_for_products, style_intensity, engagement_score, prompt_template) VALUES
('Nike Just Do It Energy', 'athletic', 'Nike', 'diagonal_action', 'high_contrast_bold', 'large_impact_sans', 'rule_of_thirds_dynamic', ARRAY['empowering', 'energetic', 'motivational', 'bold'], 'bottom_left_strong', 'gradient_motion_blur', ARRAY['sports gear', 'fitness', 'athletic wear', 'performance products'], 9, 94, 'Dynamic action shot with bold diagonal composition, high-contrast lighting, motion blur effect, {product} prominently featured in motion, empowering athletic energy, Nike-inspired bold typography'),

('Adidas Three Stripes Bold', 'athletic', 'Adidas', 'three_column_split', 'monochrome_accent', 'geometric_bold_sans', 'symmetrical_balance', ARRAY['bold', 'structured', 'confident', 'clean'], 'center_bottom', 'solid_color_geometric', ARRAY['sportswear', 'sneakers', 'athletic accessories', 'training gear'], 8, 91, 'Clean geometric composition with three-stripe visual motif, {product} centered with symmetrical balance, monochrome with pop of color, bold sans-serif typography, Adidas-inspired structured design'),

('Under Armour Warrior Spirit', 'athletic', 'Under Armour', 'centered_hero', 'dark_dramatic', 'athletic_condensed', 'centered_dominance', ARRAY['intense', 'determined', 'focused', 'powerful'], 'top_right_corner', 'dark_gradient_spotlight', ARRAY['compression wear', 'training equipment', 'performance apparel'], 9, 89, 'Dark dramatic lighting with spotlight on {product}, intense warrior energy, centered composition with powerful presence, Under Armour-inspired gritty determination aesthetic'),

('Puma Speed Motion', 'athletic', 'Puma', 'horizontal_speed_lines', 'vibrant_neon', 'sleek_italic_modern', 'leading_lines_forward', ARRAY['fast', 'sleek', 'modern', 'dynamic'], 'left_side_vertical', 'speed_lines_motion', ARRAY['running shoes', 'speed gear', 'athletic footwear'], 8, 87, 'Horizontal speed lines creating forward motion, {product} with sleek modern presentation, vibrant neon accents, Puma-inspired fast and fluid design'),

('Reebok CrossFit Grit', 'athletic', 'Reebok', 'raw_textured', 'industrial_muted', 'strong_slab_serif', 'asymmetric_raw', ARRAY['gritty', 'authentic', 'strong', 'raw'], 'bottom_right_rotated', 'concrete_texture', ARRAY['crossfit gear', 'training shoes', 'functional fitness'], 7, 85, 'Raw industrial aesthetic with concrete texture, {product} in authentic training environment, gritty and strong composition, Reebok CrossFit-inspired authentic fitness vibe'),

('Lululemon Mindful Movement', 'athletic', 'Lululemon', 'soft_centered', 'pastel_calming', 'elegant_thin_sans', 'breathing_space', ARRAY['mindful', 'balanced', 'serene', 'premium'], 'top_center_minimal', 'soft_gradient_light', ARRAY['yoga wear', 'athleisure', 'wellness products', 'meditation accessories'], 6, 88, 'Soft calming composition with breathing space, {product} in mindful movement, pastel color palette, Lululemon-inspired premium wellness aesthetic'),

('Gymshark Hustle Culture', 'athletic', 'Gymshark', 'split_screen_contrast', 'black_white_accent', 'bold_uppercase_impact', 'contrast_duality', ARRAY['hustle', 'ambitious', 'focused', 'driven'], 'center_overlapping', 'split_tone_dramatic', ARRAY['gym wear', 'workout apparel', 'fitness accessories'], 9, 92, 'Split-screen contrast showing transformation energy, {product} with hustle culture vibe, black and white with accent color, Gymshark-inspired ambitious fitness aesthetic'),

('New Balance Heritage', 'athletic', 'New Balance', 'classic_centered', 'heritage_navy_red', 'timeless_serif_modern', 'classic_balance', ARRAY['timeless', 'quality', 'authentic', 'balanced'], 'bottom_center_banner', 'textured_vintage', ARRAY['sneakers', 'classic footwear', 'lifestyle athletic wear'], 7, 84, 'Classic balanced composition with heritage color palette, {product} presented with timeless quality, navy and red accents, New Balance-inspired authentic craftsmanship'),

('ASICS Precision Tech', 'athletic', 'ASICS', 'technical_grid', 'blue_tech_gradient', 'technical_sans_clean', 'grid_precision', ARRAY['technical', 'precise', 'engineered', 'scientific'], 'top_left_label', 'tech_grid_overlay', ARRAY['running shoes', 'technical sportswear', 'performance gear'], 8, 86, 'Technical grid layout showing engineering precision, {product} with scientific details highlighted, blue tech gradient, ASICS-inspired biomechanical precision'),

('Patagonia Adventure Spirit', 'athletic', 'Patagonia', 'natural_landscape', 'earth_tones_natural', 'outdoor_rustic_sans', 'rule_of_thirds_nature', ARRAY['adventurous', 'sustainable', 'rugged', 'authentic'], 'bottom_left_organic', 'natural_landscape_blend', ARRAY['outdoor gear', 'hiking equipment', 'sustainable athletic wear'], 7, 90, 'Natural landscape composition with adventure spirit, {product} in outdoor authentic setting, earth tones and natural textures, Patagonia-inspired sustainable rugged design'),

('On Running Swiss Precision', 'athletic', 'On Running', 'minimal_cloud_tech', 'white_minimalist_pop', 'swiss_precision_clean', 'minimal_focus', ARRAY['innovative', 'clean', 'precise', 'lightweight'], 'top_right_minimal', 'cloud_soft_minimal', ARRAY['running shoes', 'performance footwear', 'innovative athletic gear'], 8, 88, 'Minimal Swiss design with cloud-like softness, {product} with precision engineering focus, clean white with color pop, On Running-inspired innovative simplicity'),

('Hoka One One Bold Color', 'athletic', 'Hoka', 'oversized_bold', 'saturated_color_block', 'chunky_rounded_bold', 'oversized_dominance', ARRAY['bold', 'playful', 'confident', 'fun'], 'side_color_block', 'solid_vibrant_colors', ARRAY['maximalist shoes', 'bold athletic wear', 'statement sportswear'], 9, 87, 'Oversized bold composition with saturated color blocks, {product} as confident statement piece, chunky rounded typography, Hoka-inspired maximalist bold design'),

('Columbia Trail Ready', 'athletic', 'Columbia', 'outdoor_action', 'forest_mountain_tones', 'outdoor_adventure_sans', 'environmental_context', ARRAY['ready', 'durable', 'outdoor', 'reliable'], 'top_banner_badge', 'outdoor_environment', ARRAY['outdoor apparel', 'trail gear', 'adventure equipment'], 7, 83, 'Outdoor action shot in natural environment, {product} ready for adventure, forest and mountain color palette, Columbia-inspired trail-ready reliability'),

('Salomon Mountain Tech', 'athletic', 'Salomon', 'technical_alpine', 'alpine_technical_blue', 'angular_technical_modern', 'sharp_angles_mountain', ARRAY['technical', 'alpine', 'expert', 'performance'], 'diagonal_technical', 'mountain_gradient_tech', ARRAY['trail running', 'mountain gear', 'technical outdoor equipment'], 8, 89, 'Technical alpine composition with sharp angles, {product} with mountain performance focus, blue technical gradients, Salomon-inspired expert mountain gear aesthetic'),

('Nike ACG Outdoor Urban', 'athletic', 'Nike ACG', 'urban_outdoor_hybrid', 'utility_orange_accent', 'utility_geometric_bold', 'layered_functional', ARRAY['versatile', 'urban', 'outdoor', 'functional'], 'corner_utility_label', 'urban_outdoor_texture', ARRAY['outdoor urban wear', 'utility apparel', 'all-conditions gear'], 8, 91, 'Urban outdoor hybrid composition with utility focus, {product} showing versatile functionality, orange utility accents, Nike ACG-inspired all-conditions design');

-- TECH/INNOVATION TEMPLATES (15)
INSERT INTO static_ad_templates (template_name, category, brand_inspiration, layout_type, color_scheme, typography_style, composition_rule, mood_keywords, text_overlay_position, background_treatment, best_for_products, style_intensity, engagement_score, prompt_template) VALUES
('Apple Minimalist Premium', 'tech', 'Apple', 'centered_minimal', 'white_minimal_shadow', 'san_francisco_clean', 'centered_simplicity', ARRAY['elegant', 'simple', 'premium', 'refined'], 'bottom_center_thin', 'pure_white_soft_shadow', ARRAY['electronics', 'tech accessories', 'premium gadgets', 'smart devices'], 10, 97, 'Ultra-minimal centered composition with soft shadows, {product} as singular focus on pure white, refined elegant typography, Apple-inspired premium simplicity'),

('Tesla Futuristic Innovation', 'tech', 'Tesla', 'sleek_horizontal', 'black_silver_electric', 'futuristic_thin_extended', 'horizontal_flow', ARRAY['innovative', 'futuristic', 'electric', 'sleek'], 'bottom_left_futuristic', 'dark_gradient_glow', ARRAY['electric vehicles', 'automotive tech', 'sustainable tech', 'innovation products'], 9, 95, 'Sleek horizontal composition with electric energy, {product} with futuristic glow effect, black with silver electric accents, Tesla-inspired innovation aesthetic'),

('Samsung Galaxy Vibrant', 'tech', 'Samsung', 'dynamic_angles', 'vibrant_gradient_bold', 'modern_sans_dynamic', 'angular_dynamic', ARRAY['vibrant', 'dynamic', 'modern', 'exciting'], 'top_right_bold', 'colorful_gradient_flow', ARRAY['smartphones', 'consumer electronics', 'tech accessories', 'displays'], 8, 93, 'Dynamic angular composition with vibrant gradients, {product} with exciting modern energy, bold colorful flow, Samsung-inspired dynamic technology'),

('Google Material Playful', 'tech', 'Google', 'material_layers', 'primary_colors_bright', 'product_sans_friendly', 'layered_depth', ARRAY['playful', 'accessible', 'colorful', 'friendly'], 'floating_card', 'material_shadow_layers', ARRAY['software', 'apps', 'consumer tech', 'smart home'], 7, 90, 'Material design layered composition with colorful shadows, {product} with playful accessibility, primary colors and friendly spacing, Google-inspired approachable tech'),

('Microsoft Professional Trust', 'tech', 'Microsoft', 'professional_grid', 'corporate_blue_gradient', 'segoe_professional_clean', 'grid_structure', ARRAY['professional', 'trustworthy', 'reliable', 'corporate'], 'top_left_header', 'blue_gradient_professional', ARRAY['enterprise software', 'business tech', 'productivity tools', 'professional equipment'], 7, 87, 'Professional grid structure with corporate trust, {product} in business context, blue gradient with clean lines, Microsoft-inspired enterprise reliability'),

('Sony Premium Audio Visual', 'tech', 'Sony', 'cinematic_wide', 'cinematic_black_gold', 'premium_geometric_modern', 'cinematic_ratio', ARRAY['cinematic', 'premium', 'immersive', 'high-end'], 'bottom_banner_elegant', 'black_gradient_luxury', ARRAY['audio equipment', 'cameras', 'entertainment tech', 'premium electronics'], 9, 91, 'Cinematic wide composition with premium feel, {product} with luxury audio-visual presence, black with gold accents, Sony-inspired high-end entertainment'),

('Amazon Convenient Simple', 'tech', 'Amazon', 'product_focused', 'white_orange_accent', 'amazon_ember_friendly', 'straightforward_clear', ARRAY['convenient', 'simple', 'accessible', 'reliable'], 'top_banner_simple', 'clean_white_functional', ARRAY['consumer products', 'smart devices', 'everyday tech', 'home automation'], 6, 88, 'Straightforward product-focused composition, {product} with convenient accessibility, white with orange accent, Amazon-inspired functional simplicity'),

('Dyson Engineering Beauty', 'tech', 'Dyson', 'technical_beauty', 'engineered_aesthetic', 'technical_elegant_sans', 'form_function_balance', ARRAY['engineered', 'beautiful', 'technical', 'premium'], 'side_technical_detail', 'gradient_technical_glow', ARRAY['home tech', 'engineering products', 'innovative appliances', 'design-focused tech'], 9, 92, 'Technical beauty composition showing engineering, {product} with form-meets-function elegance, gradient glow highlighting design, Dyson-inspired aesthetic engineering'),

('DJI Aerial Perspective', 'tech', 'DJI', 'aerial_view', 'sky_blue_dynamic', 'modern_tech_bold', 'birds_eye_perspective', ARRAY['aerial', 'perspective', 'innovative', 'expansive'], 'corner_minimal_tech', 'sky_gradient_height', ARRAY['drones', 'cameras', 'aerial tech', 'photography gear'], 8, 90, 'Aerial perspective composition from above, {product} with expansive innovative view, sky blue dynamic gradients, DJI-inspired aerial technology'),

('Bose Acoustic Luxury', 'tech', 'Bose', 'sound_wave_visual', 'black_gold_premium', 'acoustic_elegant_serif', 'sound_visualization', ARRAY['acoustic', 'premium', 'immersive', 'sophisticated'], 'bottom_elegant_minimal', 'sound_wave_texture', ARRAY['audio equipment', 'speakers', 'headphones', 'sound systems'], 8, 89, 'Sound wave visualization with acoustic luxury, {product} with immersive premium feel, black and gold sophistication, Bose-inspired audio excellence'),

('GoPro Action Adventure', 'tech', 'GoPro', 'first_person_action', 'vibrant_action_colors', 'bold_adventure_sans', 'action_perspective', ARRAY['action', 'adventure', 'exciting', 'bold'], 'corner_badge_dynamic', 'action_environment', ARRAY['action cameras', 'adventure gear', 'sports tech', 'rugged electronics'], 9, 94, 'First-person action perspective with adventure energy, {product} in exciting activity context, vibrant action colors, GoPro-inspired bold adventure'),

('Logitech Gaming Performance', 'tech', 'Logitech', 'gaming_tech', 'rgb_gaming_dark', 'gaming_angular_bold', 'tech_gaming_focus', ARRAY['gaming', 'performance', 'technical', 'powerful'], 'side_stats_tech', 'dark_rgb_glow', ARRAY['gaming peripherals', 'performance tech', 'esports gear', 'gaming accessories'], 9, 91, 'Gaming tech composition with RGB glow effects, {product} with performance focus and technical details, dark with RGB lighting, Logitech-inspired gaming excellence'),

('Bang & Olufsen Danish Design', 'tech', 'Bang & Olufsen', 'scandinavian_minimal', 'natural_aluminum_wood', 'danish_elegant_geometric', 'scandinavian_simplicity', ARRAY['elegant', 'crafted', 'timeless', 'sophisticated'], 'minimal_bottom_elegant', 'natural_material_texture', ARRAY['luxury audio', 'premium speakers', 'design electronics', 'high-end audio'], 9, 90, 'Scandinavian minimal composition with natural materials, {product} with timeless crafted elegance, aluminum and wood tones, Bang & Olufsen-inspired Danish design'),

('Sonos Modern Home Audio', 'tech', 'Sonos', 'lifestyle_home', 'modern_home_neutral', 'contemporary_clean_sans', 'lifestyle_integration', ARRAY['modern', 'integrated', 'lifestyle', 'seamless'], 'top_minimal_lifestyle', 'home_environment_natural', ARRAY['home speakers', 'smart audio', 'lifestyle tech', 'home automation'], 7, 88, 'Modern home lifestyle integration, {product} seamlessly in living space, neutral contemporary tones, Sonos-inspired home audio aesthetics'),

('Anker Reliable Essential', 'tech', 'Anker', 'functional_clear', 'tech_blue_reliable', 'clear_functional_sans', 'functional_clarity', ARRAY['reliable', 'essential', 'practical', 'trustworthy'], 'top_banner_functional', 'clean_functional_gradient', ARRAY['charging accessories', 'cables', 'power banks', 'essential tech'], 6, 85, 'Functional clear composition showing reliability, {product} as essential everyday tech, blue reliable gradient, Anker-inspired practical trustworthiness');

-- LUXURY/PREMIUM TEMPLATES (15)
INSERT INTO static_ad_templates (template_name, category, brand_inspiration, layout_type, color_scheme, typography_style, composition_rule, mood_keywords, text_overlay_position, background_treatment, best_for_products, style_intensity, engagement_score, prompt_template) VALUES
('Chanel Timeless Elegance', 'luxury', 'Chanel', 'centered_classic', 'black_white_gold', 'didot_elegant_serif', 'symmetrical_classic', ARRAY['timeless', 'elegant', 'sophisticated', 'iconic'], 'bottom_center_refined', 'pure_minimalist_luxury', ARRAY['fashion', 'fragrance', 'luxury accessories', 'beauty products'], 10, 96, 'Timeless centered composition with classic elegance, {product} as iconic luxury piece, black white and gold palette, Chanel-inspired sophisticated refinement'),

('Louis Vuitton Heritage', 'luxury', 'Louis Vuitton', 'heritage_monogram', 'brown_gold_heritage', 'luxury_serif_classic', 'heritage_symmetry', ARRAY['heritage', 'prestigious', 'crafted', 'exclusive'], 'bottom_banner_gold', 'heritage_texture_pattern', ARRAY['luxury bags', 'leather goods', 'premium accessories', 'travel items'], 9, 94, 'Heritage composition with monogram elegance, {product} with prestigious craftsmanship, brown gold luxury palette, Louis Vuitton-inspired exclusive heritage'),

('Rolex Precision Luxury', 'luxury', 'Rolex', 'precision_centered', 'gold_black_precision', 'serif_precision_refined', 'perfect_symmetry', ARRAY['precise', 'prestigious', 'timeless', 'perfection'], 'minimal_bottom_elegant', 'black_gradient_spotlight', ARRAY['watches', 'timepieces', 'luxury accessories', 'precision instruments'], 10, 95, 'Precision-centered composition with perfect symmetry, {product} with prestigious craftsmanship spotlight, gold and black luxury, Rolex-inspired timeless perfection'),

('Gucci Maximalist Luxury', 'luxury', 'Gucci', 'maximalist_ornate', 'rich_jewel_tones', 'ornate_serif_decorative', 'layered_richness', ARRAY['opulent', 'bold', 'artistic', 'maximalist'], 'ornate_frame_corners', 'rich_pattern_luxury', ARRAY['luxury fashion', 'statement accessories', 'designer items', 'bold luxury'], 9, 92, 'Maximalist ornate composition with rich patterns, {product} with opulent artistic expression, jewel tone richness, Gucci-inspired bold luxury maximalism'),

('Hermès Artisan Craft', 'luxury', 'Hermès', 'artisan_detail', 'orange_brown_craft', 'elegant_craft_serif', 'detail_focus', ARRAY['artisan', 'crafted', 'timeless', 'refined'], 'corner_craftsmanship', 'leather_texture_elegant', ARRAY['leather goods', 'handcrafted items', 'artisan products', 'premium accessories'], 9, 93, 'Artisan detail composition showing craftsmanship, {product} with handmade refinement, orange and brown craft tones, Hermès-inspired timeless artistry'),

('Tiffany & Co Iconic Blue', 'luxury', 'Tiffany', 'iconic_blue_box', 'tiffany_blue_white', 'elegant_script_refined', 'gift_presentation', ARRAY['iconic', 'romantic', 'precious', 'elegant'], 'ribbon_elegant', 'tiffany_blue_signature', ARRAY['jewelry', 'precious items', 'romantic gifts', 'luxury accessories'], 10, 94, 'Iconic blue box presentation composition, {product} as precious gift, signature Tiffany blue and white, Tiffany-inspired romantic luxury'),

('Burberry British Heritage', 'luxury', 'Burberry', 'british_classic', 'beige_check_pattern', 'british_serif_refined', 'heritage_check', ARRAY['british', 'classic', 'heritage', 'refined'], 'heritage_crest', 'check_pattern_texture', ARRAY['luxury fashion', 'outerwear', 'british luxury', 'heritage items'], 8, 90, 'British heritage composition with check pattern, {product} with classic refinement, beige heritage tones, Burberry-inspired British luxury'),

('Cartier Jewel Precious', 'luxury', 'Cartier', 'jewel_centered', 'red_gold_precious', 'luxury_script_elegant', 'precious_centered', ARRAY['precious', 'iconic', 'romantic', 'timeless'], 'minimal_script_bottom', 'red_luxury_gradient', ARRAY['jewelry', 'watches', 'precious accessories', 'luxury gifts'], 10, 95, 'Jewel-centered composition with precious elegance, {product} as iconic treasure, red and gold precious tones, Cartier-inspired romantic luxury'),

('Prada Intellectual Modern', 'luxury', 'Prada', 'intellectual_minimal', 'black_minimal_modern', 'modern_serif_intellectual', 'minimal_sophistication', ARRAY['intellectual', 'modern', 'minimal', 'sophisticated'], 'top_left_minimal', 'minimal_black_texture', ARRAY['fashion', 'accessories', 'intellectual luxury', 'modern design'], 9, 91, 'Intellectual minimal composition with modern sophistication, {product} with refined simplicity, black minimal elegance, Prada-inspired intellectual luxury'),

('Dior Haute Couture', 'luxury', 'Dior', 'haute_couture', 'elegant_pastels_gold', 'couture_script_elegant', 'romantic_elegance', ARRAY['romantic', 'elegant', 'feminine', 'haute'], 'script_elegant_bottom', 'pastel_luxury_soft', ARRAY['haute fashion', 'beauty', 'romantic luxury', 'feminine elegance'], 9, 93, 'Haute couture romantic composition, {product} with feminine elegance, pastel gold luxury, Dior-inspired romantic sophistication'),

('Versace Bold Baroque', 'luxury', 'Versace', 'baroque_bold', 'gold_black_baroque', 'bold_serif_ornate', 'baroque_maximalist', ARRAY['bold', 'baroque', 'opulent', 'statement'], 'ornate_medallion', 'baroque_pattern_gold', ARRAY['luxury fashion', 'bold accessories', 'statement luxury', 'maximalist design'], 10, 92, 'Bold baroque composition with ornate patterns, {product} as opulent statement, gold and black maximalism, Versace-inspired bold luxury'),

('Bottega Veneta Intrecciato', 'luxury', 'Bottega Veneta', 'woven_texture', 'earthy_leather_tones', 'minimal_elegant_sans', 'texture_focus', ARRAY['crafted', 'textured', 'subtle', 'refined'], 'minimal_corner', 'woven_leather_texture', ARRAY['leather goods', 'woven accessories', 'subtle luxury', 'artisan craft'], 8, 90, 'Woven texture composition highlighting craft, {product} with intrecciato elegance, earthy leather tones, Bottega Veneta-inspired subtle luxury'),

('Saint Laurent Rock Chic', 'luxury', 'Saint Laurent', 'rock_edgy', 'black_gold_rock', 'edgy_modern_serif', 'edgy_asymmetric', ARRAY['edgy', 'rock', 'modern', 'bold'], 'side_bold', 'dark_rock_texture', ARRAY['edgy fashion', 'rock luxury', 'modern accessories', 'bold design'], 9, 91, 'Rock chic edgy composition with modern edge, {product} with bold attitude, black and gold rock aesthetic, Saint Laurent-inspired edgy luxury'),

('Montblanc Craftsmanship', 'luxury', 'Montblanc', 'crafted_detail', 'black_white_gold', 'crafted_serif_classic', 'detail_craftsmanship', ARRAY['crafted', 'precise', 'heritage', 'quality'], 'emblem_corner', 'detailed_texture', ARRAY['writing instruments', 'leather goods', 'crafted accessories', 'executive items'], 9, 89, 'Craftsmanship detail composition with heritage, {product} with precise quality, black white and gold elegance, Montblanc-inspired executive luxury'),

('Balenciaga Avant Garde', 'luxury', 'Balenciaga', 'avant_garde_bold', 'monochrome_statement', 'bold_sans_oversized', 'deconstructed_bold', ARRAY['avant-garde', 'bold', 'statement', 'modern'], 'oversized_typography', 'stark_minimal_bold', ARRAY['avant-garde fashion', 'statement accessories', 'modern luxury', 'bold design'], 9, 90, 'Avant-garde bold composition with statement presence, {product} with deconstructed modernity, stark monochrome, Balenciaga-inspired bold luxury');

-- FOOD/BEVERAGE TEMPLATES (15)
INSERT INTO static_ad_templates (template_name, category, brand_inspiration, layout_type, color_scheme, typography_style, composition_rule, mood_keywords, text_overlay_position, background_treatment, best_for_products, style_intensity, engagement_score, prompt_template) VALUES
('Coca-Cola Classic Joy', 'food_beverage', 'Coca-Cola', 'iconic_red_centered', 'signature_red_white', 'spencerian_script_bold', 'centered_iconic', ARRAY['joyful', 'classic', 'refreshing', 'iconic'], 'bottom_script_banner', 'red_gradient_bubbles', ARRAY['beverages', 'refreshments', 'classic drinks', 'enjoyment products'], 10, 96, 'Iconic red centered composition with joyful energy, {product} with refreshing bubble effects, signature red and white, Coca-Cola-inspired classic happiness'),

('Starbucks Coffee Culture', 'food_beverage', 'Starbucks', 'coffee_lifestyle', 'green_warm_inviting', 'handwritten_friendly', 'lifestyle_warmth', ARRAY['warm', 'community', 'cozy', 'inviting'], 'corner_handwritten', 'warm_coffee_ambiance', ARRAY['coffee', 'café items', 'warm beverages', 'community products'], 8, 92, 'Coffee culture lifestyle composition with warm community, {product} in cozy café setting, green warm inviting tones, Starbucks-inspired coffee lifestyle'),

('McDonald''s Fun Family', 'food_beverage', 'McDonald''s', 'playful_bright', 'yellow_red_bright', 'rounded_playful_sans', 'fun_accessible', ARRAY['fun', 'family', 'playful', 'accessible'], 'top_playful_banner', 'bright_cheerful_gradient', ARRAY['fast food', 'family meals', 'quick service', 'fun food'], 8, 90, 'Playful bright composition with family fun energy, {product} with cheerful accessibility, yellow and red brightness, McDonald''s-inspired fun dining'),

('Red Bull Energy Extreme', 'food_beverage', 'Red Bull', 'extreme_action', 'metallic_blue_silver', 'bold_athletic_modern', 'action_dynamic', ARRAY['extreme', 'energetic', 'bold', 'action'], 'dynamic_angle', 'action_sports_energy', ARRAY['energy drinks', 'sports beverages', 'performance drinks', 'active lifestyle'], 10, 95, 'Extreme action composition with energy rush, {product} in dynamic sports context, metallic blue and silver, Red Bull-inspired extreme energy'),

('Pepsi Bold Generation', 'food_beverage', 'Pepsi', 'bold_blue_centered', 'pepsi_blue_vibrant', 'bold_modern_sans', 'bold_centered', ARRAY['bold', 'young', 'vibrant', 'exciting'], 'center_bold_modern', 'blue_gradient_vibrant', ARRAY['soft drinks', 'beverages', 'youth products', 'bold refreshments'], 9, 91, 'Bold blue centered composition with youth energy, {product} with vibrant excitement, Pepsi blue gradient, Pepsi-inspired bold generation'),

('Ben & Jerry''s Fun Flavor', 'food_beverage', 'Ben & Jerry''s', 'quirky_colorful', 'multicolor_playful', 'hand_drawn_fun', 'playful_chaos', ARRAY['quirky', 'fun', 'indulgent', 'playful'], 'handwritten_corner', 'colorful_illustrated', ARRAY['ice cream', 'desserts', 'indulgent treats', 'fun food'], 8, 89, 'Quirky colorful composition with fun indulgence, {product} with playful illustrated style, multicolor chaos, Ben & Jerry''s-inspired fun flavor'),

('Nespresso Premium Coffee', 'food_beverage', 'Nespresso', 'premium_sophisticated', 'black_gold_elegant', 'elegant_modern_serif', 'sophisticated_minimal', ARRAY['premium', 'sophisticated', 'elegant', 'refined'], 'bottom_minimal_gold', 'black_gradient_luxury', ARRAY['coffee', 'premium beverages', 'sophisticated drinks', 'gourmet items'], 9, 93, 'Premium sophisticated composition with coffee elegance, {product} as refined luxury, black and gold minimal, Nespresso-inspired sophisticated premium'),

('Heineken Premium Lager', 'food_beverage', 'Heineken', 'premium_green', 'signature_green_silver', 'classic_premium_sans', 'classic_premium', ARRAY['premium', 'social', 'sophisticated', 'classic'], 'bottom_star_emblem', 'green_gradient_premium', ARRAY['beer', 'alcoholic beverages', 'premium drinks', 'social occasions'], 8, 88, 'Premium green composition with social sophistication, {product} with classic star emblem, signature green and silver, Heineken-inspired premium lager'),

('Oreo Playful Twist', 'food_beverage', 'Oreo', 'playful_twist', 'black_white_playful', 'bold_rounded_playful', 'twist_rotate', ARRAY['playful', 'fun', 'nostalgic', 'iconic'], 'twisted_angle', 'playful_cookie_pattern', ARRAY['cookies', 'snacks', 'fun treats', 'nostalgic food'], 8, 90, 'Playful twist composition with nostalgic fun, {product} with iconic twist energy, black and white playfulness, Oreo-inspired cookie joy'),

('Gatorade Athletic Performance', 'food_beverage', 'Gatorade', 'athletic_bold', 'bold_sports_colors', 'bold_athletic_uppercase', 'athletic_action', ARRAY['athletic', 'performance', 'bold', 'energetic'], 'diagonal_bold', 'sports_action_gradient', ARRAY['sports drinks', 'performance beverages', 'athletic hydration', 'active products'], 9, 92, 'Athletic bold composition with performance energy, {product} in sports action context, bold athletic colors, Gatorade-inspired performance hydration'),

('Häagen-Dazs Indulgent Luxury', 'food_beverage', 'Häagen-Dazs', 'indulgent_premium', 'burgundy_gold_elegant', 'elegant_serif_refined', 'indulgent_centered', ARRAY['indulgent', 'premium', 'sophisticated', 'luxurious'], 'bottom_elegant_serif', 'burgundy_luxury_texture', ARRAY['ice cream', 'premium desserts', 'indulgent treats', 'luxury food'], 9, 91, 'Indulgent premium composition with luxury appeal, {product} as sophisticated treat, burgundy and gold elegance, Häagen-Dazs-inspired luxury indulgence'),

('Chipotle Fresh Bold', 'food_beverage', 'Chipotle', 'fresh_ingredients', 'earth_red_fresh', 'bold_handcrafted_sans', 'ingredient_showcase', ARRAY['fresh', 'bold', 'authentic', 'quality'], 'corner_fresh_label', 'ingredient_texture', ARRAY['fresh food', 'fast casual', 'quality ingredients', 'authentic cuisine'], 7, 87, 'Fresh ingredients composition with bold authenticity, {product} with quality showcase, earth red fresh tones, Chipotle-inspired fresh bold'),

('Corona Beach Paradise', 'food_beverage', 'Corona', 'beach_paradise', 'blue_sky_sand', 'relaxed_beachy_serif', 'paradise_escape', ARRAY['relaxed', 'paradise', 'escape', 'beachy'], 'minimal_beach', 'beach_sky_gradient', ARRAY['beer', 'beach beverages', 'vacation drinks', 'relaxation products'], 8, 90, 'Beach paradise composition with relaxed escape, {product} in tropical setting, blue sky and sand tones, Corona-inspired beach vacation'),

('Nutella Delicious Spread', 'food_beverage', 'Nutella', 'delicious_indulgent', 'hazelnut_brown_warm', 'friendly_rounded_sans', 'indulgent_swirl', ARRAY['delicious', 'indulgent', 'warm', 'comforting'], 'swirl_design', 'warm_brown_texture', ARRAY['spreads', 'breakfast items', 'indulgent food', 'comfort products'], 8, 89, 'Delicious indulgent composition with warm comfort, {product} with hazelnut swirl design, warm brown tones, Nutella-inspired delicious indulgence'),

('Whole Foods Organic Natural', 'food_beverage', 'Whole Foods', 'organic_natural', 'green_earth_natural', 'natural_organic_sans', 'natural_ingredients', ARRAY['organic', 'natural', 'healthy', 'fresh'], 'corner_organic_badge', 'natural_texture_green', ARRAY['organic food', 'natural products', 'healthy items', 'fresh produce'], 7, 86, 'Organic natural composition with healthy freshness, {product} with natural ingredient focus, green earth tones, Whole Foods-inspired organic quality');

-- FASHION/LIFESTYLE TEMPLATES (15)
INSERT INTO static_ad_templates (template_name, category, brand_inspiration, layout_type, color_scheme, typography_style, composition_rule, mood_keywords, text_overlay_position, background_treatment, best_for_products, style_intensity, engagement_score, prompt_template) VALUES
('Zara Minimal Chic', 'fashion_lifestyle', 'Zara', 'editorial_minimal', 'neutral_minimal_chic', 'modern_editorial_sans', 'editorial_simplicity', ARRAY['chic', 'modern', 'editorial', 'minimal'], 'top_minimal', 'neutral_clean_backdrop', ARRAY['fashion', 'apparel', 'modern clothing', 'lifestyle wear'], 8, 91, 'Editorial minimal chic composition with modern simplicity, {product} with fashion-forward style, neutral minimal tones, Zara-inspired editorial fashion'),

('H&M Accessible Style', 'fashion_lifestyle', 'H&M', 'lifestyle_diverse', 'colorful_accessible', 'friendly_modern_sans', 'diverse_inclusive', ARRAY['accessible', 'diverse', 'modern', 'inclusive'], 'corner_friendly', 'lifestyle_context_bright', ARRAY['fashion', 'everyday wear', 'accessible clothing', 'lifestyle products'], 7, 88, 'Lifestyle diverse composition with accessible style, {product} with inclusive modern appeal, colorful friendly tones, H&M-inspired accessible fashion'),

('Supreme Streetwear Culture', 'fashion_lifestyle', 'Supreme', 'streetwear_bold', 'red_white_iconic', 'bold_box_logo_style', 'centered_statement', ARRAY['streetwear', 'bold', 'cultural', 'iconic'], 'box_logo_centered', 'urban_texture_bold', ARRAY['streetwear', 'urban fashion', 'statement pieces', 'cultural items'], 10, 95, 'Streetwear bold composition with cultural statement, {product} as iconic piece, red white box logo style, Supreme-inspired street culture'),

('Uniqlo Functional Simple', 'fashion_lifestyle', 'Uniqlo', 'functional_clean', 'primary_colors_simple', 'clean_functional_sans', 'grid_organized', ARRAY['functional', 'simple', 'quality', 'accessible'], 'minimal_functional', 'clean_organized_grid', ARRAY['basic wear', 'functional clothing', 'everyday essentials', 'quality basics'], 7, 85, 'Functional simple composition with quality organization, {product} with accessible design, primary simple colors, Uniqlo-inspired functional basics'),

('Levi''s Denim Heritage', 'fashion_lifestyle', 'Levi''s', 'denim_authentic', 'indigo_denim_classic', 'american_classic_serif', 'authentic_heritage', ARRAY['authentic', 'heritage', 'classic', 'durable'], 'red_tab_corner', 'denim_texture_authentic', ARRAY['denim', 'jeans', 'classic wear', 'heritage fashion'], 9, 90, 'Denim authentic heritage composition with classic durability, {product} with American heritage, indigo denim tones, Levi''s-inspired authentic denim'),

('Nike Sportswear Lifestyle', 'fashion_lifestyle', 'Nike', 'athletic_lifestyle', 'swoosh_modern_bold', 'athletic_modern_sans', 'lifestyle_athletic', ARRAY['athletic', 'lifestyle', 'modern', 'comfortable'], 'swoosh_placement', 'lifestyle_athletic_blend', ARRAY['sportswear', 'athleisure', 'lifestyle athletic', 'modern comfort'], 9, 93, 'Athletic lifestyle composition with modern comfort, {product} blending sport and life, swoosh modern tones, Nike-inspired athleisure'),

('Patagonia Sustainable Style', 'fashion_lifestyle', 'Patagonia', 'outdoor_sustainable', 'earth_outdoor_natural', 'outdoor_authentic_sans', 'sustainable_nature', ARRAY['sustainable', 'outdoor', 'authentic', 'responsible'], 'minimal_earth_badge', 'natural_outdoor_texture', ARRAY['outdoor wear', 'sustainable fashion', 'eco-friendly items', 'adventure gear'], 8, 89, 'Outdoor sustainable composition with authentic nature, {product} with responsible outdoors focus, earth natural tones, Patagonia-inspired sustainable style'),

('Reformation Sustainable Chic', 'fashion_lifestyle', 'Reformation', 'feminine_sustainable', 'soft_feminine_earth', 'feminine_editorial_serif', 'feminine_editorial', ARRAY['feminine', 'sustainable', 'chic', 'conscious'], 'minimal_sustainable', 'soft_feminine_natural', ARRAY['feminine fashion', 'sustainable clothing', 'conscious style', 'eco-chic wear'], 8, 90, 'Feminine sustainable chic composition with conscious style, {product} with editorial earth tones, soft feminine elegance, Reformation-inspired eco-chic'),

('Everlane Transparent Simple', 'fashion_lifestyle', 'Everlane', 'transparent_honest', 'neutral_honest_minimal', 'honest_clean_sans', 'transparent_simplicity', ARRAY['transparent', 'honest', 'simple', 'ethical'], 'corner_honest_pricing', 'clean_minimal_backdrop', ARRAY['ethical fashion', 'transparent pricing', 'honest basics', 'simple wear'], 7, 86, 'Transparent honest composition with ethical simplicity, {product} with radical transparency, neutral minimal tones, Everlane-inspired honest fashion'),

('Adidas Originals Retro', 'fashion_lifestyle', 'Adidas', 'retro_stripes', 'vintage_trefoil_colors', 'retro_bold_athletic', 'retro_sporty', ARRAY['retro', 'sporty', 'classic', 'iconic'], 'trefoil_placement', 'retro_gradient_sport', ARRAY['retro sportswear', 'vintage athletic', 'classic sneakers', 'street fashion'], 9, 92, 'Retro stripes composition with sporty nostalgia, {product} with trefoil heritage, vintage athletic colors, Adidas Originals-inspired retro sport'),

('Allbirds Comfort Natural', 'fashion_lifestyle', 'Allbirds', 'natural_comfort', 'natural_wool_earth', 'soft_natural_sans', 'comfort_natural', ARRAY['comfortable', 'natural', 'sustainable', 'simple'], 'minimal_natural_label', 'natural_material_texture', ARRAY['comfortable shoes', 'natural footwear', 'sustainable wear', 'simple comfort'], 7, 87, 'Natural comfort composition with sustainable simplicity, {product} with material focus, natural wool earth tones, Allbirds-inspired comfort natural'),

('Warby Parker Accessible Smart', 'fashion_lifestyle', 'Warby Parker', 'smart_accessible', 'modern_glasses_colors', 'smart_friendly_sans', 'accessible_smart', ARRAY['smart', 'accessible', 'friendly', 'modern'], 'corner_try_on', 'clean_modern_lifestyle', ARRAY['eyewear', 'glasses', 'accessible fashion', 'smart style'], 7, 88, 'Smart accessible composition with friendly modernity, {product} in lifestyle context, modern glasses tones, Warby Parker-inspired accessible smart'),

('Glossier Millennial Pink', 'fashion_lifestyle', 'Glossier', 'millennial_aesthetic', 'soft_pink_minimal', 'friendly_rounded_sans', 'soft_minimal_beauty', ARRAY['millennial', 'soft', 'friendly', 'minimal'], 'minimal_pink_accent', 'soft_pink_gradient', ARRAY['beauty', 'skincare', 'millennial products', 'lifestyle beauty'], 8, 91, 'Millennial aesthetic composition with soft beauty, {product} with friendly minimal style, soft pink gradient, Glossier-inspired millennial beauty'),

('Outdoor Voices Doing Things', 'fashion_lifestyle', 'Outdoor Voices', 'recreation_playful', 'primary_playful_bold', 'playful_bold_sans', 'recreation_active', ARRAY['playful', 'active', 'recreation', 'fun'], 'playful_corner', 'active_lifestyle_colors', ARRAY['activewear', 'recreation wear', 'fun athletic', 'lifestyle active'], 8, 89, 'Recreation playful composition with active fun, {product} for doing things, primary playful colors, Outdoor Voices-inspired recreational style'),

('COS Scandinavian Minimal', 'fashion_lifestyle', 'COS', 'scandinavian_architecture', 'neutral_architectural', 'architectural_clean_sans', 'architectural_minimal', ARRAY['architectural', 'minimal', 'scandinavian', 'refined'], 'minimal_architectural', 'architectural_space', ARRAY['minimal fashion', 'scandinavian design', 'architectural wear', 'refined basics'], 8, 87, 'Scandinavian architectural composition with refined minimalism, {product} in architectural space, neutral refined tones, COS-inspired design fashion');

-- BEAUTY/WELLNESS TEMPLATES (10)
INSERT INTO static_ad_templates (template_name, category, brand_inspiration, layout_type, color_scheme, typography_style, composition_rule, mood_keywords, text_overlay_position, background_treatment, best_for_products, style_intensity, engagement_score, prompt_template) VALUES
('Fenty Beauty Inclusive', 'beauty_wellness', 'Fenty', 'bold_inclusive', 'diverse_skin_tones', 'bold_modern_impact', 'inclusive_diversity', ARRAY['inclusive', 'bold', 'diverse', 'empowering'], 'bold_corner', 'diverse_beauty_gradient', ARRAY['makeup', 'beauty products', 'inclusive cosmetics', 'diverse skincare'], 9, 94, 'Bold inclusive composition celebrating diversity, {product} with empowering representation, diverse skin tone palette, Fenty-inspired inclusive beauty'),

('Lush Fresh Handmade', 'beauty_wellness', 'Lush', 'fresh_handmade', 'natural_vibrant_fresh', 'handmade_friendly_bold', 'ingredient_fresh', ARRAY['fresh', 'handmade', 'natural', 'vibrant'], 'handwritten_label', 'fresh_ingredient_texture', ARRAY['fresh cosmetics', 'handmade beauty', 'natural products', 'ethical skincare'], 8, 90, 'Fresh handmade composition with natural ingredients, {product} with vibrant handcrafted appeal, natural fresh colors, Lush-inspired handmade beauty'),

('The Ordinary Clinical Simple', 'beauty_wellness', 'The Ordinary', 'clinical_minimal', 'white_clinical_clean', 'clinical_sans_simple', 'scientific_minimal', ARRAY['clinical', 'scientific', 'simple', 'honest'], 'minimal_scientific', 'clean_white_laboratory', ARRAY['skincare', 'clinical beauty', 'scientific cosmetics', 'functional beauty'], 7, 88, 'Clinical minimal composition with scientific simplicity, {product} with honest formulation focus, white clinical clean, The Ordinary-inspired clinical beauty'),

('Drunk Elephant Clean Clinical', 'beauty_wellness', 'Drunk Elephant', 'clean_colorful', 'clean_beauty_pastels', 'clean_friendly_modern', 'clean_ingredient', ARRAY['clean', 'effective', 'colorful', 'friendly'], 'colorful_label', 'pastel_clean_gradient', ARRAY['clean skincare', 'effective beauty', 'ingredient-focused', 'modern skincare'], 8, 91, 'Clean colorful composition with effective ingredients, {product} with friendly clinical appeal, clean pastel tones, Drunk Elephant-inspired clean beauty'),

('Peloton Wellness Community', 'beauty_wellness', 'Peloton', 'fitness_community', 'energetic_community_bold', 'motivational_bold_sans', 'community_energy', ARRAY['motivational', 'community', 'energetic', 'connected'], 'motivational_banner', 'energetic_fitness_gradient', ARRAY['fitness equipment', 'wellness products', 'community fitness', 'active lifestyle'], 9, 92, 'Fitness community composition with motivational energy, {product} with connected wellness, energetic bold colors, Peloton-inspired community fitness'),

('Olaplex Professional Science', 'beauty_wellness', 'Olaplex', 'professional_science', 'clinical_purple_professional', 'professional_clean_sans', 'scientific_professional', ARRAY['professional', 'scientific', 'effective', 'clinical'], 'professional_corner', 'clinical_professional_gradient', ARRAY['hair care', 'professional beauty', 'scientific treatments', 'salon products'], 8, 89, 'Professional science composition with clinical effectiveness, {product} with scientific credibility, purple professional tones, Olaplex-inspired science beauty'),

('Alo Yoga Mindful Wellness', 'beauty_wellness', 'Alo Yoga', 'mindful_lifestyle', 'soft_wellness_neutrals', 'mindful_elegant_sans', 'wellness_balance', ARRAY['mindful', 'balanced', 'wellness', 'premium'], 'minimal_wellness', 'soft_wellness_gradient', ARRAY['yoga wear', 'wellness products', 'mindful lifestyle', 'premium activewear'], 8, 90, 'Mindful wellness composition with balanced lifestyle, {product} with premium mindfulness, soft wellness neutrals, Alo Yoga-inspired mindful fitness'),

('Tatcha Japanese Beauty', 'beauty_wellness', 'Tatcha', 'japanese_elegance', 'gold_camellia_elegant', 'elegant_japanese_serif', 'japanese_refinement', ARRAY['elegant', 'refined', 'japanese', 'luxurious'], 'elegant_japanese_seal', 'japanese_gold_gradient', ARRAY['luxury skincare', 'japanese beauty', 'refined cosmetics', 'elegant wellness'], 9, 91, 'Japanese elegance composition with refined beauty, {product} with luxurious ritual, gold camellia tones, Tatcha-inspired Japanese skincare'),

('Beautycounter Safe Beauty', 'beauty_wellness', 'Beautycounter', 'safe_clean', 'clean_safe_pastels', 'clean_modern_friendly', 'safe_transparent', ARRAY['safe', 'clean', 'transparent', 'responsible'], 'clean_safe_label', 'clean_pastel_texture', ARRAY['clean beauty', 'safe cosmetics', 'transparent skincare', 'responsible products'], 7, 87, 'Safe clean composition with transparent responsibility, {product} with safety focus, clean pastel tones, Beautycounter-inspired safe beauty'),

('Headspace Calm Mindfulness', 'beauty_wellness', 'Headspace', 'calm_mindful', 'orange_calm_gradient', 'friendly_rounded_calm', 'mindful_breathing', ARRAY['calm', 'mindful', 'peaceful', 'friendly'], 'minimal_breathing', 'calm_gradient_peaceful', ARRAY['wellness apps', 'mindfulness products', 'calm lifestyle', 'mental wellness'], 7, 89, 'Calm mindful composition with peaceful breathing, {product} for mental wellness, orange calm gradient, Headspace-inspired mindful calm');

-- AUTOMOTIVE TEMPLATES (10)
INSERT INTO static_ad_templates (template_name, category, brand_inspiration, layout_type, color_scheme, typography_style, composition_rule, mood_keywords, text_overlay_position, background_treatment, best_for_products, style_intensity, engagement_score, prompt_template) VALUES
('BMW Ultimate Driving', 'automotive', 'BMW', 'dynamic_performance', 'blue_white_motorsport', 'bold_dynamic_sans', 'motion_performance', ARRAY['performance', 'dynamic', 'luxury', 'engineered'], 'kidney_grille_badge', 'motion_blur_performance', ARRAY['luxury cars', 'performance vehicles', 'automotive tech', 'driving experience'], 9, 93, 'Dynamic performance composition with motion energy, {product} with ultimate driving focus, BMW blue and white, BMW-inspired driving excellence'),

('Mercedes Luxury Engineering', 'automotive', 'Mercedes-Benz', 'luxury_prestige', 'silver_black_luxury', 'elegant_luxury_serif', 'prestige_centered', ARRAY['luxury', 'prestigious', 'engineered', 'refined'], 'star_emblem_centered', 'luxury_gradient_prestige', ARRAY['luxury vehicles', 'premium cars', 'automotive luxury', 'engineered excellence'], 9, 94, 'Luxury engineering composition with prestige focus, {product} with refined excellence, silver luxury tones, Mercedes-inspired automotive prestige'),

('Tesla Future Electric', 'automotive', 'Tesla', 'futuristic_minimal', 'sleek_silver_electric', 'futuristic_minimal_sans', 'futuristic_clean', ARRAY['futuristic', 'electric', 'innovative', 'minimal'], 'minimal_future', 'electric_glow_minimal', ARRAY['electric vehicles', 'sustainable automotive', 'future transport', 'innovative cars'], 10, 96, 'Futuristic minimal composition with electric innovation, {product} with sustainable future, sleek electric tones, Tesla-inspired future mobility'),

('Porsche Sports Performance', 'automotive', 'Porsche', 'sports_dynamic', 'racing_red_black', 'sports_bold_italic', 'racing_motion', ARRAY['sporty', 'racing', 'performance', 'dynamic'], 'crest_corner', 'racing_track_motion', ARRAY['sports cars', 'performance vehicles', 'racing heritage', 'dynamic automotive'], 10, 95, 'Sports dynamic composition with racing heritage, {product} with performance motion, racing red and black, Porsche-inspired sports excellence'),

('Volvo Safety Scandinavian', 'automotive', 'Volvo', 'safety_scandinavian', 'blue_silver_trust', 'scandinavian_trust_sans', 'safety_centered', ARRAY['safe', 'trusted', 'scandinavian', 'family'], 'iron_mark_badge', 'trust_safety_gradient', ARRAY['family vehicles', 'safe cars', 'scandinavian design', 'trusted automotive'], 8, 88, 'Safety scandinavian composition with trust focus, {product} with family safety, blue trust tones, Volvo-inspired scandinavian safety'),

('Ferrari Racing Passion', 'automotive', 'Ferrari', 'racing_passion', 'ferrari_red_black', 'racing_italic_dramatic', 'passionate_motion', ARRAY['passionate', 'racing', 'luxury', 'italian'], 'prancing_horse', 'racing_passion_gradient', ARRAY['luxury sports cars', 'racing vehicles', 'italian automotive', 'passionate driving'], 10, 97, 'Racing passion composition with Italian luxury, {product} with prancing horse heritage, Ferrari red intensity, Ferrari-inspired racing passion'),

('Land Rover Adventure Capable', 'automotive', 'Land Rover', 'adventure_rugged', 'british_green_rugged', 'adventure_strong_serif', 'rugged_terrain', ARRAY['adventurous', 'capable', 'rugged', 'british'], 'heritage_badge', 'terrain_adventure_texture', ARRAY['SUVs', 'adventure vehicles', 'off-road capable', 'rugged automotive'], 8, 90, 'Adventure capable composition with rugged terrain, {product} with go-anywhere ability, British green heritage, Land Rover-inspired adventure'),

('Audi Progressive Technology', 'automotive', 'Audi', 'progressive_tech', 'silver_red_tech', 'modern_progressive_sans', 'progressive_quattro', ARRAY['progressive', 'technical', 'modern', 'innovative'], 'four_rings_minimal', 'tech_gradient_progressive', ARRAY['tech vehicles', 'progressive cars', 'modern automotive', 'innovative design'], 9, 91, 'Progressive technology composition with quattro innovation, {product} with modern technical focus, silver red tech, Audi-inspired progressive design'),

('Jeep Freedom Adventure', 'automotive', 'Jeep', 'freedom_outdoor', 'olive_adventure_rugged', 'rugged_bold_uppercase', 'adventure_freedom', ARRAY['freedom', 'adventure', 'capable', 'rugged'], 'grille_badge_iconic', 'outdoor_adventure_texture', ARRAY['adventure SUVs', 'off-road vehicles', 'outdoor automotive', 'freedom driving'], 9, 92, 'Freedom adventure composition with go-anywhere spirit, {product} with outdoor capability, olive rugged tones, Jeep-inspired freedom adventure'),

('Lexus Japanese Luxury', 'automotive', 'Lexus', 'japanese_luxury_tech', 'elegant_silver_japanese', 'elegant_tech_serif', 'japanese_precision', ARRAY['luxurious', 'precise', 'japanese', 'refined'], 'spindle_grille_badge', 'japanese_luxury_gradient', ARRAY['luxury vehicles', 'japanese cars', 'refined automotive', 'precision engineering'], 9, 90, 'Japanese luxury composition with precision craftsmanship, {product} with refined technology, elegant Japanese silver, Lexus-inspired luxury precision');

-- MINIMAL/CLEAN TEMPLATES (5)
INSERT INTO static_ad_templates (template_name, category, brand_inspiration, layout_type, color_scheme, typography_style, composition_rule, mood_keywords, text_overlay_position, background_treatment, best_for_products, style_intensity, engagement_score, prompt_template) VALUES
('Muji No Brand Quality', 'minimal_clean', 'Muji', 'minimal_functional', 'natural_beige_minimal', 'minimal_sans_functional', 'functional_minimal', ARRAY['minimal', 'functional', 'quality', 'simple'], 'minimal_corner', 'natural_minimal_texture', ARRAY['home goods', 'functional products', 'minimalist items', 'quality basics'], 7, 86, 'Minimal functional composition with no-brand quality, {product} with simple excellence, natural beige minimal, Muji-inspired functional minimalism'),

('IKEA Democratic Design', 'minimal_clean', 'IKEA', 'democratic_simple', 'blue_yellow_accessible', 'friendly_functional_sans', 'accessible_functional', ARRAY['democratic', 'accessible', 'functional', 'simple'], 'minimal_functional', 'clean_functional_backdrop', ARRAY['furniture', 'home products', 'functional design', 'accessible items'], 7, 88, 'Democratic design composition with accessible function, {product} with simple affordability, blue yellow functional, IKEA-inspired democratic design'),

('Muji Style Simplicity', 'minimal_clean', 'Muji', 'simplicity_essence', 'white_natural_essence', 'essence_minimal_sans', 'essential_simplicity', ARRAY['simple', 'essential', 'natural', 'peaceful'], 'minimal_essence', 'white_peaceful_minimal', ARRAY['lifestyle products', 'essential items', 'natural goods', 'peaceful living'], 7, 85, 'Simplicity essence composition with natural peace, {product} as essential item, white natural minimal, Muji-inspired essential simplicity'),

('Norm Architects Minimal', 'minimal_clean', 'Norm Architects', 'architectural_minimal', 'concrete_minimal_space', 'architectural_thin_sans', 'spatial_minimal', ARRAY['architectural', 'spatial', 'minimal', 'refined'], 'architectural_minimal', 'concrete_space_minimal', ARRAY['design products', 'architectural items', 'refined goods', 'spatial design'], 8, 87, 'Architectural minimal composition with spatial refinement, {product} in minimal space, concrete refined tones, Norm-inspired architectural minimalism'),

('Kinfolk Slow Living', 'minimal_clean', 'Kinfolk', 'slow_living_minimal', 'soft_neutral_living', 'editorial_slow_serif', 'slow_living_breath', ARRAY['slow', 'intentional', 'calm', 'editorial'], 'minimal_editorial', 'soft_living_texture', ARRAY['lifestyle products', 'slow living items', 'intentional goods', 'calm lifestyle'], 7, 88, 'Slow living minimal composition with intentional calm, {product} with breathing space, soft neutral editorial, Kinfolk-inspired slow living');
