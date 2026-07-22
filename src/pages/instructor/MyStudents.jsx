import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, getDocs, where, documentId } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Users, Phone, Search, ChevronRight, GraduationCap, MapPin, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyStudents() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const fetchStudents = async () => {
      try {
        const instructorId = userProfile?.id || userProfile?.uid || currentUser.uid;
        
        // 1. Fetch explicitly assigned students
        const stuQ = query(collection(db, 'students'), where('assignedInstructorId', '==', instructorId));
        const stuSnap = await getDocs(stuQ);
        const assignedStudents = stuSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 2. Fetch students who have a session with this instructor
        const sessQ = query(collection(db, 'sessions'), where('instructorId', '==', instructorId));
        const sessSnap = await getDocs(sessQ);
        
        // Extract unique student IDs from sessions
        const sessionStudentIds = [...new Set(sessSnap.docs.map(d => d.data().studentId).filter(Boolean))];
        
        // Filter out IDs we already have from assignedStudents
        const assignedIds = new Set(assignedStudents.map(s => s.id));
        const idsToFetch = sessionStudentIds.filter(id => !assignedIds.has(id));

        const sessionStudents = [];
        // Firestore 'in' query supports up to 10 items at a time
        for (let i = 0; i < idsToFetch.length; i += 10) {
          const chunk = idsToFetch.slice(i, i + 10);
          if (chunk.length > 0) {
            const chunkQ = query(collection(db, 'students'), where(documentId(), 'in', chunk));
            const chunkSnap = await getDocs(chunkQ);
            chunkSnap.docs.forEach(d => sessionStudents.push({ id: d.id, ...d.data() }));
          }
        }

        const allStudents = [...assignedStudents, ...sessionStudents];
        setStudents(allStudents);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [currentUser, userProfile]);

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    return (s.name || '').toLowerCase().includes(term) || (s.phone || '').includes(term);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">My Students</h1>
          <p className="text-gray-500 text-lg">Manage your assigned students and track their progress.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={20} />
          </div>
          <input 
            type="text" 
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            placeholder="Search name or phone..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={40} className="text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No students assigned yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">When an admin assigns a student to you, they will appear here automatically.</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(s => {
            const completed = s.classesCompleted || 0;
            const total = s.classesTotal || 0;
            const progressPct = total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;
            
            return (
              <div 
                key={s.id} 
                onClick={() => navigate(`/instructor/students/${s.id}`)}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col"
              >
                {/* Banner / Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 flex items-start justify-between border-b border-gray-100 relative">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white relative z-10">
                      {s.name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div className="relative z-10">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">{s.name || 'Student Name'}</h3>
                      <div className="flex items-center text-gray-500 text-sm mt-1 gap-1">
                        <Phone size={14} /> 
                        <span>{s.phone || 'No phone'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-blue-50 transition-colors shadow-sm relative z-10">
                    <ChevronRight size={18} />
                  </div>
                  
                  {/* Decorative background shape */}
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white opacity-40 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                </div>

                {/* Body Details */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="space-y-4 mb-6 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                        <GraduationCap size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Package</p>
                        <p className="text-sm font-semibold text-gray-800">{s.packageId || 'Standard Level'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-orange-50 text-orange-600 mt-0.5">
                        <Award size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Status</p>
                        <p className="text-sm font-semibold text-gray-800 capitalize">
                          {(s.practiceStatus || 'In Progress').replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</span>
                      <span className="text-sm font-bold text-primary">{completed} / {total || '?'}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          progressPct === 100 ? 'bg-green-500' : 'bg-primary'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
