import React from 'react';

const ConfirmDeleteForm = (props) => {
	// REQUIRES setDisplayModal(function) prop

	// PROPS
	const { setDisplayModal } = props;
	const formTitle = props.title || 'Confirm Delete';
	const formDeleteItem = props.message || 'this item';
	const deleteFunc = props.deleteFunc;

	const handleDelete = (e) => {
		e.preventDefault();
		deleteFunc();
		setDisplayModal(false);
	};

	return (
		<>
			<h2 style={{ margin: 0, padding: 0, fontWeight: 600 }}>{formTitle}</h2>
			<hr className='modal-form-hr' />

			<div className='delete-modal-body'>
				<p>{'Are you sure you want to permanently delete ' + formDeleteItem + '?'}</p>
				<div className='delete-modal-button-row'>
					<button
						className='submit-button delete-modal-delete'
						onClick={(e) => handleDelete(e)}>
						Delete
					</button>
					<button className='submit-button' onClick={() => setDisplayModal(false)}>
						Cancel
					</button>
				</div>
			</div>
		</>
	);
};

export default ConfirmDeleteForm;
