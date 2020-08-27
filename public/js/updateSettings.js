// updateData
// import axios  -- ES6 syntax
import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data,type) => {
    const url = type === 'password' ? '/api/v1/users/updateMyPassword' : '/api/v1/users/updateMe'
  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });

    if (res.data.status === 'Success!') {
      showAlert('success', `User ${type.toUpperCase()} updated successfully!`);
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
