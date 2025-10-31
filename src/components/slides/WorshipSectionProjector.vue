<template>
    <div
        class="w-full h-full bg-black relative flex items-center justify-center lyrics-container"
    >
        <!-- Background video (if configured) - ONLY on projector, not in control preview -->
        <VideoPlayer
            v-if="
                !isPreview &&
                slide.backgroundMode === 'single' &&
                slide.backgroundVideo
            "
            :video-url="slide.backgroundVideo"
            :library-root="libraryRoot"
            :autoplay="true"
            :muted="true"
            :loop="true"
            :show-native-controls="false"
            :broadcast-state="false"
            class="absolute inset-0 w-full h-full object-cover"
            :style="{ opacity: slide.backgroundOpacity || 0.4 }"
        />

        <!-- Lyrics overlay - clean, no section names, no chords, no song info (hidden when lyricsCleared is true or section has no lyrics) -->
        <Transition name="lyrics-fade">
            <div
                v-if="!slide.lyricsCleared && hasLyrics"
                :key="lyricsKey"
                class="relative z-10 w-full px-12 text-center"
            >
                <div class="space-y-4">
                    <div
                        v-for="(line, lineIndex) in slide.sectionData.lines"
                        :key="lineIndex"
                        class="flex justify-center items-center flex-wrap whitespace-pre-wrap"
                    >
                        <span
                            v-for="(pair, pairIndex) in line"
                            :key="pairIndex"
                            class="lyrics-word"
                            :style="{
                                fontSize: `${baseFontSize}cqw`,
                                fontFamily:
                                    slide.fontFamily ||
                                    'system-ui, -apple-system, sans-serif',
                                fontWeight: slide.fontWeight || 600,
                                color: textColor,
                                textShadow: textShadow,
                                letterSpacing: '0.02em',
                                lineHeight: 1.2,
                            }"
                        >
                            {{ pair[1] || "\u00A0" }}
                        </span>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { computed } from "vue";
import VideoPlayer from "./VideoPlayer.vue";

const props = defineProps({
    slide: {
        type: Object,
        required: true,
    },
    libraryRoot: {
        type: String,
        default: null,
    },
    textScale: {
        type: Number,
        default: 100,
    },
    isPreview: {
        type: Boolean,
        default: false,
    },
});

// Check if section has lyrics
const hasLyrics = computed(() => {
    if (!props.slide.sectionData) return false;
    if (
        !props.slide.sectionData.lines ||
        props.slide.sectionData.lines.length === 0
    )
        return false;

    // Check if any line has actual text (not just empty pairs)
    return props.slide.sectionData.lines.some((line) =>
        line.some((pair) => pair[1] && pair[1].trim().length > 0),
    );
});

// Unique key for lyrics to trigger transition when content changes
const lyricsKey = computed(() => {
    // Include section title and first line to detect changes
    const title = props.slide.sectionData?.title || '';
    const firstLine = props.slide.sectionData?.lines?.[0]?.[0]?.[1] || '';
    const cleared = props.slide.lyricsCleared ? 'cleared' : 'shown';
    return `${title}-${firstLine}-${cleared}`;
});

// Base font size using container query units (cqw) for proportional scaling
// This will be affected by the text scale setting
const baseFontSize = computed(() => {
    // Base size in container query width units (same as bible/custom slides)
    // Default is 2.5, scaled by textScale
    const multiplier = props.textScale / 100;
    return (2.5 * multiplier).toFixed(2);
});

// Text color based on fontColor setting
const textColor = computed(() => {
    const colorMode = props.slide?.fontColor || "light";
    return colorMode === "dark" ? "#000000" : "#ffffff";
});

// Text shadow based on fontColor setting and textShadow toggle
const textShadow = computed(() => {
    // Check if text shadow is disabled
    if (props.slide?.textShadow === false) {
        return "none";
    }

    const colorMode = props.slide?.fontColor || "light";
    if (colorMode === "dark") {
        // Dark text needs light shadow
        return "2px 2px 8px rgba(255, 255, 255, 0.9), 0 0 25px rgba(255, 255, 255, 0.7)";
    } else {
        // Light text needs dark shadow
        return "2px 2px 8px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 0, 0, 0.7)";
    }
});
</script>

<style scoped>
/* Enable container queries for proportional text scaling */
.lyrics-container {
    container-type: size;
}

.lyrics-word {
    display: inline-block;
}

/* Lyrics fade transition - fast and smooth crossfade */
.lyrics-fade-enter-active,
.lyrics-fade-leave-active {
    transition: opacity 0.3s ease-in-out;
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
}

.lyrics-fade-enter-from {
    opacity: 0;
}

.lyrics-fade-leave-to {
    opacity: 0;
}

.lyrics-fade-enter-to,
.lyrics-fade-leave-from {
    opacity: 1;
}
</style>
