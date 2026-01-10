const menuToggle = document.querySelector('.menu-toggle');
  const navList = document.querySelector('nav ul');
  menuToggle.addEventListener('click', () => {
    navList.classList.toggle('show');
  });
  // Optional: Hide menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !navList.contains(e.target)) {
      navList.classList.remove('show');
    }
  });

/**
 * Loads team members from a CSV file and populates the team-list div
 * The CSV should have columns: firstname, lastname, role, profile, headshot_path
 * Team members are sorted alphabetically by last name
 * @param {string} csvFilePath - Path to the CSV file
 */
function loadTeamMembers(csvFilePath) {
  fetch(csvFilePath)
    .then(response => response.text())
    .then(data => {
      const teamList = document.getElementById('team-list');
      if (!teamList) {
        console.error('team-list div not found');
        return;
      }
      
      // Parse CSV data
      const lines = data.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Get column indices
      const firstnameIdx = headers.indexOf('firstname');
      const lastnameIdx = headers.indexOf('lastname');
      const roleIdx = headers.indexOf('role');
      const profileIdx = headers.indexOf('profile');
      const headshotIdx = headers.indexOf('headshot_path');
      
      // Parse team members
      const teamMembers = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Skip empty lines
        
        const values = lines[i].split(',').map(v => v.trim());
        teamMembers.push({
          firstname: values[firstnameIdx] || '',
          lastname: values[lastnameIdx] || '',
          role: values[roleIdx] || '',
          profile: values[profileIdx] || '',
          headshot_path: values[headshotIdx] || ''
        });
      }
      
      // Sort by last name alphabetically
      teamMembers.sort((a, b) => {
        return a.lastname.localeCompare(b.lastname);
      });
      
      // Clear the team-list div
      teamList.innerHTML = '';
      
      // Create and append team member elements
      teamMembers.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'team-member';
        
        // Create image element
        const img = document.createElement('img');
        img.src = member.headshot_path || '../images/profile-images/default-headshot.jpg';
        img.alt = `${member.firstname} ${member.lastname}`;
        img.className = 'team-photo';
        memberDiv.appendChild(img);
        
        // Create name link or span depending on whether profile link exists
        if (member.profile) {
          const nameLink = document.createElement('a');
          nameLink.href = member.profile;
          nameLink.target = '_blank';
          nameLink.className = 'team-name';
          nameLink.textContent = `${member.firstname} ${member.lastname}`;
          memberDiv.appendChild(nameLink);
        } else {
          const nameSpan = document.createElement('span');
          nameSpan.className = 'team-name';
          nameSpan.textContent = `${member.firstname} ${member.lastname}`;
          memberDiv.appendChild(nameSpan);
        }
        
        // Create role span
        const roleSpan = document.createElement('span');
        roleSpan.className = 'team-role';
        roleSpan.textContent = member.role;
        memberDiv.appendChild(roleSpan);
        
        // Append member to team list
        teamList.appendChild(memberDiv);
      });
    })
    .catch(error => {
      console.error('Error loading team members:', error);
    });
}

if (document.getElementById('team-list')) {
  $(document).ready(function(){

    $.get("../pages/student_profiles.csv", function( my_var ) {
        console.log(my_var)
    });

  });
    // document.addEventListener('DOMContentLoaded', () => {
    // loadTeamMembers('../pages/student_profiles.csv');
    // });
}