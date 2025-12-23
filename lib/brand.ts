export const brandSystem = {

  // ========================================
  // CORE LOGO VARIATIONS
  // ========================================

  logo: {

    primary_mark: {
      description: "Lion head with leaf integrated into mane",
      elements: [
        "🦁 Lion (strength, apex)",
        "🍃 Leaf emerging from mane (sustainability)",
        "⛓️ Chain crown (connected ecosystem)"
      ],
      colors: {
        lion: "var(--color-teal-500)",
        mane: "gradient: teal to light green",
        leaf: "var(--color-success)",
        chain: "gold (--color-D4AF37)"
      },
      style: "Modern, geometric, minimalist (can work at 32px or 300px)"
    },

    logo_horizontal: {
      format: "Lion + Leaf + Chain icon | GREENCHAINZ text",
      usage: "Website header, email signature, social profiles",
      spacing: "Breathing room around lion mark"
    },

    logo_stacked: {
      format: "Lion icon on top | GREENCHAINZ text below",
      usage: "Smaller spaces, social media profile pics, favicons",
      aspect_ratio: "Square"
    },

    logo_text_only: {
      format: "GREENCHAINZ in custom font",
      usage: "When space is limited",
      color: "Teal primary"
    }
  },

  // ========================================
  // ICON SYSTEM
  // ========================================

  icon_system: {

    lion_icons: {

      lion_head_simple: {
        description: "Minimalist lion face",
        usage: "App icons, buttons, badges",
        sizes: [32, 48, 64, 128],
        color_variants: ["Teal", "White", "Gold"]
      },

      lion_with_crown: {
        description: "Lion + crown (King of Green Chain)",
        usage: "Achievement badges, #1 supplier leaderboard",
        animated: "Crown glows when winner is crowned",
        size: "80x80 preferred"
      },

      lion_roaring: {
        description: "Lion mid-roar (dynamic energy)",
        usage: "Notifications, alerts, celebrations",
        animation: "Roar effect (scale up, shadow glow)",
        frame_count: "3-4 frames for subtle animation"
      },

      leafed_lion: {
        description: "Lion silhouette with leaf replacing mane",
        usage: "Alternative mark, secondary branding",
        color: "Ombre: dark teal to light green"
      }
    },

    chain_icons: {

      chain_link: {
        description: "Single chain link (interlocking)",
        usage: "Supply chain section headers, dividers",
        color: "Gold or teal"
      },

      chain_full: {
        description: "Horizontal chain (5-7 links)",
        usage: "Supply chain flow diagrams, process flows",
        animation: "Links glow sequentially (wave effect)"
      },

      chain_circle: {
        description: "Circular chain (ecosystem loop)",
        usage: "Homepage hero, circular economy messaging",
        meaning: "Closed-loop sustainability"
      }
    },

    leaf_icons: {

      single_leaf: {
        description: "Minimal botanical leaf",
        usage: "Verified badges, 'green' indicators, filters",
        color: "Teal or bright green",
        animation: "Subtle sway (CSS animation)"
      },

      leaf_cluster: {
        description: "3-5 leaves (growth, abundance)",
        usage: "Growth indicators, achievements, ratings",
        animation: "Leaves appear one-by-one on milestone"
      },

      sprouting_leaf: {
        description: "Sprout emerging (new growth)",
        usage: "New supplier onboarding, fresh certifications",
        animation: "Grow from ground up"
      }
    }
  },

  // ========================================
  // COLOR PALETTE SYSTEM
  // ========================================

  color_system: {

    primary_colors: {
      teal: {
        name: "Primary Teal",
        hex: "#218a8d",
        var: "var(--color-teal-500)",
        usage: "Logo, buttons, primary CTAs, highlights",
        psychology: "Trust, growth, sustainability"
      },

      dark_teal: {
        name: "Dark Teal",
        hex: "#1a7473",
        var: "var(--color-teal-700)",
        usage: "Dark backgrounds, hover states, borders",
        psychology: "Strength, deep trust"
      },

      light_teal: {
        name: "Light Teal",
        hex: "#32b8c6",
        var: "var(--color-teal-300)",
        usage: "Accents, light backgrounds, secondary UI",
        psychology: "Fresh, approachable, growth"
      }
    },

    secondary_colors: {
      gold: {
        name: "Regal Gold",
        hex: "#D4AF37",
        usage: "Crown, King status, premium badges, luxury feel",
        psychology: "Excellence, achievement, authority"
      },

      green: {
        name: "Eco Green",
        hex: "#2db648",
        usage: "Verification checkmarks, certified badges, growth",
        psychology: "Verified, safe, environmental"
      },

      cream: {
        name: "Background Cream",
        hex: "#fcfcf9",
        usage: "Page backgrounds, neutral cards",
        psychology: "Clean, natural, inviting"
      }
    }
  },

  // ========================================
  // TYPOGRAPHY SYSTEM
  // ========================================

  typography: {

    headline_font: {
      family: "FKGroteskNeue, Geist, Inter",
      weight: "600 (semibold)",
      usage: "H1, H2, H3 headlines, brand headers",
      style: "Modern, geometric, professional"
    },

    body_font: {
      family: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI",
      weight: "400 (normal)",
      usage: "Body copy, descriptions, lists",
      style: "Clean, readable, accessible"
    },

    mono_font: {
      family: "Berkeley Mono, ui-monospace, SFMono-Regular, Menlo",
      weight: "400",
      usage: "Code, technical specs, data displays",
      style: "Monospace for clarity"
    },

    brand_tagline_font: {
      family: "FKGroteskNeue (bold)",
      weight: "700",
      size: "24–32px",
      usage: "\"KING OF THE GREEN CHAIN\", taglines",
      style: "Bold, authoritative, uppercase"
    }
  },

  // ========================================
  // PATTERN & TEXTURE SYSTEM
  // ========================================

  patterns: {

    chain_pattern: {
      description: "Repeating chain link background texture",
      usage: "Section backgrounds, accent panels",
      opacity: "5–15% (subtle)",
      color: "Teal or gold"
    },

    leaf_pattern: {
      description: "Scattered leaf silhouettes (wallpaper style)",
      usage: "Footer background, hero section accent",
      opacity: "3–10% (very subtle)",
      animation: "Optional: slow fade in/out"
    },

    grid_pattern: {
      description: "Subtle grid (hexagon or square)",
      usage: "Data sections, leaderboard backgrounds",
      color: "Light border color",
      opacity: "5%"
    }
  },

  // ========================================
  // APPLICATION: WHERE THEY LIVE
  // ========================================

  applications: {

    website_hero: {
      layout: "Lion silhouette + Leaf accent + Chain connecting suppliers to architects",
      animation: "Subtle chain links glow (wave left to right)",
      tagline: "KING OF THE GREEN CHAIN",
      cta_button: "Lion icon + 'Become a Verified Supplier'",
      background: "Cream with 5% leaf pattern"
    },

    leaderboard_badges: {
      rank_1: "🦁👑 Lion with glowing gold crown",
      rank_2_5: "🦁 Lion (no crown)",
      rank_6_10: "🍃 Single leaf",
      icon_style: "Animated on hover (pulse/glow effect)"
    },

    supplier_profile_header: {
      logo: "Company logo (top left)",
      badge: "Leaf icon if certified, Lion if ranked, Crown if #1",
      chain_indicator: "Chain links below profile showing ecosystem connections",
      color_coding: "Teal background with company brand overlay"
    },

    email_campaigns: {
      header_image: "Lion + Leaf + Chain integrated logo",
      color_scheme: "Teal + gold accents",
      footer_badge: "Small lion icon + \"Verified by GreenChainZ\""
    },

    leaderboard_section: {
      header_icon: "Lion silhouette",
      title: "\"KING OF THE GREEN CHAIN\"",
      rank_1_trophy: "Gold crown + lion icon (animated glow)",
      animation: "Subtle pulse on crown when page loads"
    },

    mobile_app_icons: {
      home: "Lion head (simplified)",
      leaderboard: "Lion with crown",
      certifications: "Leaf icon",
      supply_chain: "Chain icon",
      profile: "Lion head variant"
    },

    social_media: {
      profile_pic: "Lion icon (stacked logo, square format)",
      cover_photo: "Lion + Leaf + Chain composition (1200x400px)",
      posts: "Lion badge for achievements, Leaf for certifications, Chain for supplier connections"
    }
  }
};
