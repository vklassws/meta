const fs = require('fs')
const path = require('path')
const glob = require('tiny-glob')

async function main() {
	let readme = '<h1 align="center"><img src="https://raw.githubusercontent.com/vklassws/meta/main/static/banners/dist/meta.svg" alt="VWS Meta - Meta package"></h1>'

	const banners = (await glob('static/banners/dist/*.svg')).map(p => path.parse(p).base)
	readme += `\n\n## Banners\n<p>\n${banners.map(banner => {
		const url = `https://raw.githubusercontent.com/vklassws/meta/main/static/banners/dist/${banner}`
		return `<a href="${url}"><img width="276" src="${url}" /></a>`
	}).join('\n')}\n</p>`


	const sortIcons = fs.readFileSync('static/icons/sort.txt', 'utf-8').split('\n')

	const icons = (await glob('static/icons/src/*')).map(p => path.parse(p).base)
	readme += `\n\n## Icons\n<p>\n${icons.slice().sort((a, b) => {
		const asi = sortIcons.indexOf(a)
		const bsi = sortIcons.indexOf(b)

		if (asi >= 0 && bsi >= 0) {
			if (asi > bsi) return 1
			if (asi < bsi) return -1
		} else if (asi >= 0) {
			return 1
		} else if (bsi >= 0) {
			return -1
		} else {
			if (a > b) return 1
			if (a < b) return -1
		}
	}).map(icon => {
		const url = `https://raw.githubusercontent.com/vklassws/meta/main/static/icons/src/${icon}`
		return `<img width="104" src="${url}">`
	}).join('\n')}\n</p>`

	fs.writeFileSync('README.md', readme)
}

main()
