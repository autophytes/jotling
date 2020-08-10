import React, { useContext, useState } from 'react';

import { LeftNavContext } from '../../../../contexts/leftNavContext';

const NewTag = ({ setShowNewTagInput }) => {
	const [tagName, setTagName] = useState('');

	const { linkStructure, setLinkStructure, navData } = useContext(LeftNavContext);

	const saveTag = (newTag) => {
		// No blank tags
		if (!newTag) {
			console.log('Tags cannot be blank');
			return;
		}

		// Prevents duplicate tags
		{
			let allDocTags = [];
			for (let tags of Object.keys(linkStructure.docTags)) {
				allDocTags = [...allDocTags, ...tags];
			}

			if (allDocTags.includes(newTag.toLowerCase())) {
				console.log("Can't use tags on more than one page");
				return;
			}
		}

		let newDocTags = [];
		if (linkStructure.docTags.hasOwnProperty(navData.currentDoc)) {
			newDocTags = linkStructure.docTags[navData.currentDoc];
		}
		newDocTags.unshift(newTag.toLowerCase());

		let newLinkStructure = JSON.parse(JSON.stringify(linkStructure));
		newLinkStructure.docTags[navData.currentDoc] = newDocTags;

		setLinkStructure(newLinkStructure);
		setShowNewTagInput(false);
	};

	return (
		<input
			autoFocus
			onChange={(e) => setTagName(e.target.value)}
			onBlur={() => saveTag(tagName)}
			onFocus={(e) => e.target.select()}
			onKeyUp={(e) => {
				if (e.key === 'Enter' || e.keyCode === 27) {
					e.target.blur();
				}
			}}
		/>
	);
};

export default NewTag;
