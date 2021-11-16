const { promises: fs } = require('fs')

const { NOTION_TOKEN, NOTION_DATABASE_ID } = process.env
if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error(
    'The environment `NOTION_TOKEN` & `NOTION_DATABASE_ID` is required.',
  )
  process.exit(1)
}

const { Client } = require('@notionhq/client')
const notion = new Client({ auth: NOTION_TOKEN })

;(async () => {
  const response = await notion.databases.query({
    database_id: NOTION_DATABASE_ID,
    filter: {
      and: [
        {
          property: 'Name',
          text: {
            is_not_empty: true,
          },
        },
        {
          property: 'Date',
          date: {
            past_month: {},
          },
        },
      ],
    },
    sorts: [
      {
        property: 'Date',
        direction: 'descending',
      },
    ],
  })

  // collect
  const supporters = response.results.map(({ properties }) => {
    return {
      createdAt: properties.Date.date.start,
      privacyLevel: 'PUBLIC',
      tier: {
        name: `$${properties.Amount.number} one time`,
        isOneTime: true,
        monthlyPriceInCents: properties.Amount.number * 100,
        monthlyPriceInDollars: properties.Amount.number,
      },
      sponsorEntity: {
        __typename: 'User',
        login: properties.Name.title[0].plain_text,
        name: properties.Name.title[0].plain_text,
        avatarUrl:
          'https://cdn.jsdelivr.net/gh/2nthony/github-itself-image-hosting-service@main/uPic/2091637068521_.picKBbZLH.jpg',
      },
    }
  })

  await fs.writeFile('.extra.json', JSON.stringify(supporters, null, 2))
})()
