import React, { useState } from 'react';
import TemplatesSVG from '../../../assets/svg/TemplatesSVG';
import TagTemplatesForm from '../../forms/TagTemplatesForm';

const TagTemplatesButton = () => {
	const [showTemplates, setShowTemplates] = useState(false);

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
