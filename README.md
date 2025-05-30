This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install the project dependencies:

Because the project uses Next15, peer dependencies may have not updated to be compatible, therefore we need to ensure that we install the legacy dependencies that were functional with Next14. The respective peers will update their packages at some point to support Next15, in which case this will no longer be necessary.

```
npm install --legacy-peer-deps
```

Next, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Design System

### UI Library

I've elected to use the `NextUI` library for some basic components needed for the UI as these are lightweight.

https://nextui.org/

### Theme

We're using `next-themes` for the ThemeProvider

https://github.com/pacocoursey/next-themes

### Icons

We're using `Tabler Icons` as the base icon library

https://tabler.io/docs/icons/react

### Background Images

The background images are svg's generated on `fffuel.co` and we're using the `mmmotif` background on the layout.

https://www.fffuel.co/mmmotif/
