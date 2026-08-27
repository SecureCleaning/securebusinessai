# Cleaning Works `llms.txt` Installation Guide

## What this file does

`llms.txt` is a small plain-text summary of the public business information that matters most: the business name, contact pathway, services, and key pages. It gives AI systems and other automated tools a clearer starting point when they read the public website.

It does not guarantee search rankings, AI citations, or leads. It should be kept accurate whenever the business details or services change.

## File to install

Install the included file as:

```text
llms.txt
```

It must be available at this exact public address:

```text
https://cleaningworks.com.au/llms.txt
```

## Installation for the current site

The public site identifies its platform as Wezi. Send the `llms.txt` file and this guide to the person or provider who manages the Cleaning Works website, and ask them to upload it to the website's top-level public folder (also called the document root or web root).

The file must sit alongside the website homepage files, not inside an images, documents, downloads, or subfolder directory.

## Optional companion code: `schema.json`

The pack also includes `schema.json`. This is a structured business-information draft for the web person. It is not uploaded as a public file.

Instead, the web person should review it and add its contents as JSON-LD inside a single `<script type="application/ld+json">` tag on the relevant public website page, usually the home page. They should first check whether the site already has LocalBusiness or organisation schema, then merge or replace carefully to avoid publishing duplicate business details.

## Steps for the web person

1. Download the supplied `llms.txt` file without changing its name.
2. Upload it to the public web root for `cleaningworks.com.au`.
3. Confirm that visiting `https://cleaningworks.com.au/llms.txt` opens the file in a browser and returns plain text.
4. Confirm that the visible contents include the Cleaning Works phone number, email, Scoresby address, and current service list.
5. Do not replace the existing `robots.txt` file or alter the website navigation as part of this installation.
6. If installing the optional schema, add the reviewed `schema.json` contents as JSON-LD on the home page and test the page after publishing.

## Quick check after upload

Open this link in a private/incognito browser window:

```text
https://cleaningworks.com.au/llms.txt
```

The page should show the text file directly. If it downloads instead, that is usually acceptable, provided the public link still works. If it displays a website error or a login screen, it has not been uploaded to the correct public folder.

## When to update it

Update the file whenever any of these change:

- Business name, phone number, email, or address
- Services offered or no longer offered
- Main website page URLs
- Customer types or locations served

## Source and confirmation

This draft was prepared from the publicly visible Cleaning Works website on 28 July 2026. Before installation, Cleaning Works should confirm that all listed services and contact details are current.
