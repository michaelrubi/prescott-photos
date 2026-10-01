/*
 * Copy that appears on more than one page, or that changes often (prices,
 * policies). Edit it here and every page that uses it updates.
 */

export interface Package {
	id: string;
	name: string;
	price: number;
	summary: string;
	session: string;
	images: string;
	includes: string[];
	featured?: boolean;
}

export const packages: Package[] = [
	{
		id: 'essential',
		name: 'Essential',
		price: 250,
		summary: 'A quick, focused session for a headshot or a fresh profile photo.',
		session: '30 minutes · 1 location',
		images: '10 edited images',
		includes: ['One outfit', 'Posing guidance throughout', 'Private online gallery', 'Print rights for personal use']
	},
	{
		id: 'signature',
		name: 'Signature',
		price: 450,
		summary: 'The full portrait experience, with time to relax and try a few looks.',
		session: '60 minutes · 1–2 locations',
		images: '25 edited images',
		includes: [
			'Up to two outfits',
			'Planning call and what-to-wear guide',
			'Private online gallery',
			'Print rights for personal use'
		],
		featured: true
	},
	{
		id: 'full-story',
		name: 'Full Story',
		price: 650,
		summary: 'For branding libraries, seniors and big milestones that deserve variety.',
		session: '90 minutes · 2 locations',
		images: '40+ edited images',
		includes: [
			'Outfit changes as you like',
			'Planning call and what-to-wear guide',
			'Gallery delivered in one week',
			'Print rights for personal use'
		]
	}
];

export const startingPrice = Math.min(...packages.map((p) => p.price));

export const addOns = [
	{ name: 'Prints', detail: 'Lab-printed on archival paper, from wallet size up to 16×24.' },
	{ name: 'Albums', detail: 'Lay-flat albums designed around your favorite images.' },
	{ name: 'Wall art', detail: 'Canvas, metal and framed pieces, ready to hang.' },
	{ name: 'Extra images', detail: 'Love more than your package includes? Add them from your gallery.' }
];

export const steps = [
	{
		title: 'Say hello',
		body: 'Send a few details through the booking form. I reply within two business days with dates and ideas.'
	},
	{
		title: 'Plan it together',
		body: 'We choose a package, a location and a time with the best light. A small retainer holds your date, and I send a guide on what to wear.'
	},
	{
		title: 'Enjoy the session',
		body: "I guide you the whole way, from where to stand to what to do with your hands. Most people relax within the first ten minutes."
	},
	{
		title: 'Get your gallery',
		body: 'Your hand-edited images arrive in a private online gallery within two weeks, ready to download, share and print.'
	}
];

export interface Faq {
	q: string;
	a: string;
}

export const sessionFaqs: Faq[] = [
	{
		q: 'How do I reserve a date?',
		a: 'A $100 retainer holds your date and comes off your package total. The rest is due after your session, before your gallery is delivered.'
	},
	{
		q: 'Where do sessions take place?',
		a: 'Anywhere around Prescott, Prescott Valley, Chino Valley, Dewey-Humboldt and Sedona at no extra cost. Farther afield is welcome too; I will quote travel up front.'
	},
	{
		q: 'How soon will I get my photos?',
		a: 'Within two weeks, or one week with the Full Story package. You will get a private online gallery to download your images and order prints.'
	},
	{
		q: 'What if I need to reschedule?',
		a: 'Life and Arizona weather happen. Let me know at least 48 hours ahead and we will move your session once at no cost, with your retainer carried over.'
	},
	{
		q: 'Do you photograph couples and families?',
		a: 'Yes. The same packages work for couples and families of up to six. For larger groups, mention it in your inquiry and I will tailor a quote.'
	},
	{
		q: 'Are prints included?',
		a: 'Every package includes digital images with permission to print them for personal use. If you would rather not deal with printing, order prints, albums and wall art straight from your gallery.'
	}
];

export const portraitFaqs: Faq[] = [
	{
		q: "I'm awkward in front of a camera. Will that show?",
		a: 'Almost everyone says this, and it never shows in the final gallery. I direct every pose and keep things moving, so you never have to guess what to do.'
	},
	{
		q: 'What should I wear?',
		a: 'Clothes you feel great in, in solid colors or subtle textures. Avoid big logos and busy patterns. After you book, I send a short guide with examples.'
	},
	{
		q: 'Do you retouch the photos?',
		a: 'Yes. Every delivered image is edited by hand, including careful skin retouching that removes temporary blemishes but still looks like you on your best day.'
	},
	{
		q: 'Can I bring someone along?',
		a: 'Of course. A friend, partner or even your dog is welcome, and they often help you relax. Just let me know ahead of time.'
	}
];

export const locations = [
	{ name: 'Watson Lake', detail: 'Granite boulders and still water. Best at sunrise and golden hour.' },
	{ name: 'Thumb Butte', detail: 'Pine forest and big views, a few minutes from downtown.' },
	{ name: 'Courthouse Square', detail: 'Elm trees, brick and Whiskey Row for a classic downtown look.' },
	{ name: 'Lynx Lake', detail: 'Tall pines and soft shade, cool even in summer.' },
	{ name: 'Willow Lake', detail: 'Open shoreline and the Granite Dells, glowing at sunset.' },
	{ name: 'Your place', detail: 'Your studio, shop or favorite spot. Great for personal branding.' }
];

export const audiences = [
	{
		title: 'Headshots',
		body: 'For LinkedIn, your company site or your next role. Clean, confident and current.'
	},
	{
		title: 'Personal branding',
		body: 'A set of images for your website and social media that shows who you are and what you do.'
	},
	{
		title: 'Seniors',
		body: 'Graduating this year? Photos that feel like you, with time for a few outfits and your favorite spots.'
	},
	{
		title: 'Milestones',
		body: 'New chapters, big birthdays, or simply because you have not had a good photo of yourself in years.'
	}
];

export const testimonials = [
	{
		quote:
			'Michael did an excellent job taking our wedding photos. He found a great spot at Red Rock Canyon with perfect lighting. He also had great pose suggestions for us.',
		name: 'Lauren'
	}
];

export const sessionTypes = [
	{ id: 'portrait', label: 'Portrait' },
	{ id: 'headshot', label: 'Headshot or branding' },
	{ id: 'senior', label: 'Senior' },
	{ id: 'couple', label: 'Couple' },
	{ id: 'family', label: 'Family' },
	{ id: 'other', label: 'Something else' }
] as const;
