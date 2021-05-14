import React from 'react';
import wrapPromise from './wrapPromise';
import MockSuspense from './MockSuspense';

const fetchUser = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ name: 'Alice' });
    }, 3000);
  });
};
function fetchProfileData() {
  let userPromise = fetchUser();
  return {
    user: wrapPromise(userPromise),
  };
}

const resource = fetchProfileData();

const ProfileDetails = () => {
  const user = resource.user.read();
  return <h1>{user.name}</h1>;
};

function App() {
  return (
    <div>
      <MockSuspense fallback={<h1>Loading profile...</h1>}>
        <ProfileDetails />
      </MockSuspense>
    </div>
  );
}
