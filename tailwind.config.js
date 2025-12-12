/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// DSTS-inspired theme colors
				primary: {
					50: '#e6f9fd',
					100: '#ccf3fb',
					200: '#99e7f7',
					300: '#66dbf3',
					400: '#33b6f0',
					500: '#2ec3f6',
					600: '#25a8d6',
					700: '#1c8db6',
					800: '#147296',
					900: '#0b5776',
					950: '#053c56'
				},
				secondary: {
					50: '#e6fcfa',
					100: '#ccf9f5',
					200: '#99f3eb',
					300: '#66ede1',
					400: '#40e0d0',
					500: '#33c9ba',
					600: '#26b2a4',
					700: '#1a9b8e',
					800: '#0d8478',
					900: '#006d62',
					950: '#00564c'
				},
				accent: {
					50: '#fef0f8',
					100: '#fde1f1',
					200: '#fbc3e3',
					300: '#f9a5d5',
					400: '#f787c7',
					500: '#f05bc8',
					600: '#d04aa8',
					700: '#b03988',
					800: '#902868',
					900: '#701748',
					950: '#500628'
				},
				// Dark theme surfaces
				surface: {
					DEFAULT: '#050712',
					50: '#1a1f36',
					100: '#151a32',
					200: '#0f1834',
					300: '#0a1024',
					400: '#070c1c',
					500: '#050712',
					600: '#040610',
					700: '#03050e',
					800: '#02040c',
					900: '#01030a',
					950: '#000208'
				},
				// Light theme compatible colors
				muted: {
					DEFAULT: '#a4b0d8',
					50: '#f4f7ff',
					100: '#e9efff',
					200: '#d3dfff',
					300: '#bccfff',
					400: '#a4b0d8',
					500: '#8c98c0',
					600: '#7480a8',
					700: '#5c6890',
					800: '#445078',
					900: '#2c3860',
					950: '#141c48'
				},
				border: {
					DEFAULT: '#414c7a',
					light: '#d1d5db'
				}
			},
			fontFamily: {
				sans: ['Noto Sans', 'Open Sans', 'system-ui', 'sans-serif'],
				mono: ['Roboto Mono', 'monospace']
			},
			fontSize: {
				xs: ['0.8125rem', { lineHeight: '1.25rem' }], // 13px
				sm: ['0.875rem', { lineHeight: '1.375rem' }], // 14px
				base: ['0.9375rem', { lineHeight: '1.5rem' }], // 15px
				lg: ['1.0625rem', { lineHeight: '1.625rem' }], // 17px
				xl: ['1.1875rem', { lineHeight: '1.75rem' }], // 19px
				'2xl': ['1.5rem', { lineHeight: '2rem' }],
				'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
				'4xl': ['2.25rem', { lineHeight: '2.5rem' }]
			},
			borderRadius: {
				lg: '0.6rem',
				md: '0.4rem',
				sm: '0.25rem'
			},
			boxShadow: {
				panel: '0 18px 40px rgba(0, 0, 0, 0.75)',
				'panel-light': '0 10px 25px rgba(0, 0, 0, 0.15)',
				glow: '0 0 20px rgba(46, 195, 246, 0.3)'
			},
			backdropBlur: {
				xs: '2px'
			}
		}
	},
	plugins: []
};
