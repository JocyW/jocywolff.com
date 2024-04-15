# Jocywolff.com

Hey, this is the repo to my private website [jocywolff.com](https://jocywolff.com). It's intended to both be a small
technical showcase and a means to generate the PDF version of my CV. This means not all the code you're seeing here is
fully optimised for web viewing.  
For example, it's a client-side rendered application, even though it's just a static page, but more about that
in [Technologies](#technologies)

## Technologies

### Frontend

This application uses [Solid.js](https://www.solidjs.com/) for rendering, because I wanted to try it out and it looked
similar enough to my main FE technology: React.

Of course using [Typescript](https://www.typescriptlang.org/), I wouldn't want to live without it anymore. Catching
errors with proper typing is a joy and duck-typing allows for some quite encapsulated types without needing lots of
mappers.

As a bundling toolchain it uses [Vite](https://vitejs.dev/), because it's the one I'm most familiar with at the moment.

Styling is done with a slightly extended [TailwindCSS](https://tailwindcss.com/) preset. Because I love the portability
of components and elements Tailwind allows you. It's also close enough to pure CSS for me to be able to write and make
sense of it quickly.

I've thrown in [Prettier](https://prettier.io/) for good measure, but in this case a similar result could've properly
also been achieved with
an `.editorconfig`

### Infrastructure

The source code, obviously, is hosted on GitHub with [Github Actions](https://github.com/features/actions) doing the CI
heavy lifting. The [workflow](./.github/workflows/deploy.yml) builds the application and uploads the bundled files
to [S3](https://aws.amazon.com/de/s3/).

On AWS, a [Cloudfront](https://aws.amazon.com/de/cloudfront/) instance is configured to serve the S3 files via HTTPS.

I've hooked up my jocywolff.com domain, which I'm renting from [OVH](https://www.ovhcloud.com) is configured to point
at [Route 53](https://aws.amazon.com/route53/)'s name servers and the root domain is configured to A name to the
Cloudfront instance.