import React, { useContext, useEffect, useState } from 'react';
import TemplatesSVG from '../../../assets/svg/TemplatesSVG';
import { RightNavContext } from '../../../contexts/rightNavContext';
import TagTemplatesForm from '../../forms/TagTemplatesForm';

const TagTemplatesButton = () => {
	const [showTemplates, setShowTemplates] = useState(false);

	const { newTagTemplate } = useContext(RightNavContext);

	// If we add a new tag, open the form
	useEffect(() => {
		if (newTagTemplate) {
			setShowTemplates(true);
		}
	}, [newTagTemplate]);

	return (
		<>
			<button className='file-nav document' onClick={() => setShowTemplates(true)}>
				<div className='svg-wrapper'>
					<TemplatesSVG />
				</div>
				<span>Tag Templates</span>
			</button>

			{showTemplates && <TagTemplatesForm setDisplayModal={setShowTemplates} />}
		</>
	);
};

export default TagTemplatesButton;
