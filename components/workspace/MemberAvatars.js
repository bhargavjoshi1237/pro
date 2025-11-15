'use client';

export default function MemberAvatars({ members, max = 5 }) {
  const displayMembers = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {displayMembers.map((member, index) => (
          <div
            key={member.id}
            className="relative w-8 h-8 rounded-full border-2 border-white dark:border-[#181818] bg-blue-600 flex items-center justify-center text-white text-xs font-semibold hover:z-10 transition-transform hover:scale-110"
            style={{ zIndex: displayMembers.length - index }}
            title={member.email}
          >
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.email}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              member.email?.charAt(0).toUpperCase()
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div
            className="relative w-8 h-8 rounded-full border-2 border-white dark:border-[#181818] bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-semibold"
            title={`${remaining} more member${remaining > 1 ? 's' : ''}`}
          >
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
}
