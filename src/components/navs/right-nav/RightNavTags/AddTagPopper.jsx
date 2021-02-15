import React, {
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
	useLayoutEffect,
	useMemo,
} from 'react';

import PopperVerticalContainer from '../../../containers/PopperVerticalContainer';

import { LeftNavContext } from '../../../../contexts/leftNavContext';
import { SettingsContext } from '../../../../contexts/settingsContext';

import Swal from 'sweetalert2';
import TagSingleSVG from '../../../../assets/svg/TagSingleSVG';

const AddTagPopper = ({ setDisplayAddTagPopper }) => {
	// STATE
	const [newTagName, setNewTagName] = useState('New Tag');
	const [allWikiDocs, setAllWikiDocs] = useState([]);

	// REF
	const newTagRef = useRef(null);
	const rightNavElRef = useRef(null);

	// CONTEXT
	const { wikiMetadata, editorStyles } = useContext(LeftNavContext);

	// MEMO
	const tagOptions = useMemo(() => {
		return Object.keys(wikiMetadata.tagTemplates).map((tagId) => ({
			id: tagId,
			tagName: wikiMetadata.tagNames[tagId],
		}));
	}, [wikiMetadata]);

	// Grab the reference to the right-nav
	useEffect(() => {
		rightNavElRef.current = document.getElementById('right-nav');
	}, []);

	const handleNewTagEnter = useCallback(
		(e) => {
			if (e.key === 'Enter' || e.keyCode === 27) {
				const wikiNames = allWikiDocs.map((item) => item.name.toLowerCase());
				console.log('wikiNames:', wikiNames);

				if (wikiNames.includes(newTagName.toLowerCase())) {
					// Visual indicator of invalid name
					Swal.fire({
						toast: true,
						title: 'Wiki name must be unique.',
						target: document.getElementById('create-new-wiki-input'),
						position: 'top-start',
						showConfirmButton: false,
						customClass: {
							container: 'new-wiki-validation-alert',
						},
						timer: 3000,
						timerProgressBar: true,
					});
				} else {
					setShowPickFolder(true);
				}
			}
		},
		[newTagName, allWikiDocs]
	);

	// After load, focuses on the new tag name
	useLayoutEffect(() => {
		setTimeout(() => {
			newTagRef.current && newTagRef.current.focus();
		}, 0);
	}, []);

	return (
		// <PopperVerticalContainer
		// 	closeFn={() => setDisplayAddTagPopper(false)}
		// 	{...{
		// 		referenceElement: rightNavElRef.current,
		// 	}}>
		<div
			className='link-popper add-to-wiki add-tag-wrapper'
			style={{ top: '5rem', right: `calc(${editorStyles.rightNav}rem + 0.5rem)` }}>
			{/* Create New Wiki */}
			<p className='popper-title'>Create Tag</p>
			<div id='create-new-wiki-input'>
				<button className='file-nav document add-to-wiki new-wiki'>
					<div className='svg-wrapper add-to-wiki'>
						<TagSingleSVG />
					</div>
					<input
						type='text'
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
					className='file-nav document add-to-wiki'
					onClick={() => console.log('select tag')}
					key={tag.id}>
					<div className='svg-wrapper add-to-wiki'>
						<TagSingleSVG />
					</div>
					<span>{tag.tagName}</span>
				</button>
			))}
		</div>

		// </PopperVerticalContainer>
	);
};

export default AddTagPopper;
