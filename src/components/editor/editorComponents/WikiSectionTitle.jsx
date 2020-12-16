import React, { useEffect, useState } from 'react';

// PROPS
// children: [{…}]
// data-offset-key: "637j0-0-0"

// TO-DO
// Potentially convert to render like the LinkDestBlock
//  - Though maybe not. Only real benefit is quick access to block, right? We can monitor
//    the children for changes in the block, update accordingly.
// Should this be a title that you have to "edit" with an input-like form? Or just text?
// On load, ensure the title is in sync with the "sections" in the docStructure
// Ensure section titles are unique per document somehow

const WikiSectionTitle = (props) => {
	const [blockKey, setBlockKey] = useState(null);
	console.log('MyCustomBlock hath rendered.');
	console.log(props);

	// Load the blockKey
	const dataOffsetKey = props['data-offset-key'];
	useEffect(() => {
		console.log('dataOffsetKey changed');

		setBlockKey((prev) => {
			if (prev !== dataOffsetKey.slice(0, 5)) {
				return dataOffsetKey.slice(0, 5);
			} else {
				return prev;
			}
		});
	}, [dataOffsetKey]);

	return <div className='wiki-section-title'>{props.children}</div>;
};

export default WikiSectionTitle;
