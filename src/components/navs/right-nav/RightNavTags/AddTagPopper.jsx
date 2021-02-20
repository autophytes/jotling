import React, {
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
	useLayoutEffect,
	useMemo,
} from 'react';

import { LeftNavContext } from '../../../../contexts/leftNavContext';
import { RightNavContext } from '../../../../contexts/rightNavContext';

import TagSingleSVG from '../../../../assets/svg/TagSingleSVG';

const AddTagPopper = ({ setDisplayAddTagPopper, displayDoc }) => {
	// STATE
	const [newTagName, setNewTagName] = useState('New Tag');

	// REF
	const newTagRef = useRef(null);
	const rightNavElRef = useRef(null);
	const addTagContainerRef = useRef(null);

	// CONTEXT
	const { wikiMetadata, editorStyles, setWikiMetadata } = useContext(LeftNavContext);
	const { setNewTagTemplate } = useContext(RightNavContext);

	// MEMO
	const tagOptions = useMemo(() => {
		return Object.keys(wikiMetadata.tagTemplates).map((tagId) => ({
			id: tagId,
			tagName: wikiMetadata.tagNames[tagId],
		}));
	}, [wikiMetadata]);
	const usedTags = wikiMetadata.wikis
		? wikiMetadata.wikis[displayDoc]
			? Object.keys(wikiMetadata.wikis[displayDoc])
			: []
		: [];

	// Grab the reference to the right-nav
	useEffect(() => {
		rightNavElRef.current = document.getElementById('right-nav');
	}, []);

	// TODO
	const handleNewTagEnter = useCallback(
		(e) => {
			if (e.key === 'Enter' || e.keyCode === 27) {
				if (newTagName) {
					setNewTagTemplate(newTagName);
					setDisplayAddTagPopper(false);
				}
			}
		},
		[newTagName]
	);

	//   wikis: {
	//     doc5.json: {
	//        1: {
	//          1: '5\'10"'
	//          2: '175lbs'
	//          3: 'Brown, short cut, wavy'
	//        }
	//     },
	//     deleted: {
	//       doc5.json: {

	//       }
	//     }
	//   },

	const toggleTag = (tagId) => {
		let newWikiMetadata = JSON.parse(JSON.stringify(wikiMetadata));

		// Make sure deleted[displayDoc] exists
		if (!newWikiMetadata.wikis.hasOwnProperty('deleted')) {
			newWikiMetadata.wikis.deleted = {};
		}
		if (!newWikiMetadata.wikis.deleted.hasOwnProperty(displayDoc)) {
			newWikiMetadata.wikis.deleted[displayDoc] = {};
		}
		if (!newWikiMetadata.wikis.hasOwnProperty(displayDoc)) {
			newWikiMetadata.wikis[displayDoc] = {};
		}

		// Toggle ON/OFF
		if (newWikiMetadata.wikis[displayDoc].hasOwnProperty(tagId)) {
			// Toggle Off
			const tagObj = { ...newWikiMetadata.wikis[displayDoc][tagId] };
			delete newWikiMetadata.wikis[displayDoc][tagId];
			console.log('does this still exist? tagObj:', tagObj);

			newWikiMetadata.wikis.deleted[displayDoc][tagId] = tagObj;

			setWikiMetadata(newWikiMetadata);
		} else {
			// Toggle On
			let tagObj = {};
			if (newWikiMetadata.wikis.deleted[displayDoc].hasOwnProperty(tagId)) {
				tagObj = { ...newWikiMetadata.wikis.deleted[displayDoc][tagId] };
				delete newWikiMetadata.wikis.deleted[displayDoc][tagId];
				console.log('does this still exist? tagObj:', tagObj);
			}

			newWikiMetadata.wikis[displayDoc][tagId] = tagObj;

			setWikiMetadata(newWikiMetadata);
		}
	};

	// NEED TO UPDATE - close function
	// Closes the popper if clicking outside the popper or hitting escape
	useEffect(() => {
		const handleEscapePopper = (e) => {
			if (e.keyCode === 27) {
				e.stopPropagation();
				console.log('escape key - closing popper');
				setDisplayAddTagPopper(false);
			}
		};

		const handleExternalClickPopper = (e) => {
			if (addTagContainerRef.current && !addTagContainerRef.current.contains(e.target)) {
				e.stopPropagation();
				console.log('external click - closing popper');
				setDisplayAddTagPopper(false);
			}
		};

		document.addEventListener('click', handleExternalClickPopper);
		document.addEventListener('keyup', handleEscapePopper);

		return () => {
			document.removeEventListener('click', handleExternalClickPopper);
			document.removeEventListener('keyup', handleEscapePopper);
		};
	}, []);

	// After load, focuses on the new tag name
	useLayoutEffect(() => {
		setTimeout(() => {
			newTagRef.current && newTagRef.current.focus();
		}, 0);
	}, []);

	return (
		<div
			className='link-popper add-to-wiki add-tag-wrapper'
			style={{ right: `calc(${editorStyles.rightNav}rem + 0.5rem)` }}
			ref={addTagContainerRef}>
			{/* Create New Wiki */}
			<p className='popper-title'>Create Tag</p>
			<div id='create-new-wiki-input'>
				<button className='file-nav document add-to-wiki new-wiki'>
					<div className='svg-wrapper add-to-wiki'>
						<TagSingleSVG />
					</div>
					<input
						type='text'
						className='create-new-tag-input'
						value={newTagName}
						ref={newTagRef}
						spellCheck={false}
						onChange={(e) => setNewTagName(e.target.value)}
						onFocus={(e) => {
							e.target.select();
						}}
						onKeyUp={handleNewTagEnter}
					/>
				</button>
			</div>
			<hr />

			{/* Select Tag */}
			<p className='popper-title'>Select Tag</p>
			{tagOptions.map((tag) => (
				// NEED TO ADD CLICK AND HOVER
				<button
					className={
						'file-nav document add-to-wiki' + (usedTags.includes(tag.id) ? ' active' : '')
					}
					style={{ marginBottom: '0.25rem' }}
					onClick={() => toggleTag(tag.id)}
					key={tag.id}>
					<div className='svg-wrapper add-to-wiki'>
						<TagSingleSVG />
					</div>
					<span>{tag.tagName}</span>
				</button>
			))}
		</div>
	);
};

export default AddTagPopper;
