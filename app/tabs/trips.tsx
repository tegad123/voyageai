console.log('=== [tabs/trips.tsx] File loaded ===');
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Modal,
  Pressable
} from 'react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, Users, DollarSign, X } from 'lucide-react-native';
import { useChatSessions } from '../../context/ChatSessionContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'expo-router';
import { ItineraryRecord } from '../../context/ChatSessionContext';
import { parseISO, format } from 'date-fns';
import { getCachedImage } from '../../utils/imageCache';
import { FontAwesome } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import Colors from '../../constants/Colors';
import { useItinerary } from '../../context/ItineraryContext';

export default function TripsScreen() {
  console.log('=== [tabs/trips.tsx] Exporting default TripsScreen ===');
  const [selectedTrip, setSelectedTrip] = useState<ItineraryRecord | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [processingUpdate, setProcessingUpdate] = useState<string | null>(null);

  const { sessions, switchSession, setActiveItinerary, updateStatus, deleteItinerary } = useChatSessions();
  const { t } = useLanguage();
  const router = useRouter();
  const { setPlans, setTripTitle } = useItinerary();

  const drafts: ItineraryRecord[] = useMemo(()=>{
    return Object.values(sessions)
      .flatMap(s=>Object.values(s.itineraries));
  },[sessions]);

  const handleTripPress = (trip: ItineraryRecord) => {
    setSelectedTrip(trip);
  };

  const handleBookPress = () => {
    setShowBookingModal(true);
  };

  const openTrip = (trip: ItineraryRecord) => {
    console.log('[TRIPS] Opening trip:', trip.title);
    try {
      // Validate trip data before proceeding
      if (!trip.days || trip.days.length === 0) {
        console.warn('[TRIPS] Trip has no days data:', trip.title);
        return;
      }

      // Set itinerary context so app/itinerary screen can render
      setPlans(trip.days);
      setTripTitle(trip.title || 'Untitled Trip');

      // Switch to the associated chat session so editing works if needed
      if (trip.chatSessionId) {
        switchSession(trip.chatSessionId);
      }
      setActiveItinerary(trip.id);

      // Navigate to itinerary screen
      console.log('[TRIPS] Navigating to /itinerary');
      router.push('/itinerary');
    } catch (error) {
      console.error('[TRIPS] Error opening trip:', error);
    }
  };

  const handleStatusUpdate = async (itineraryId: string, newStatus: ItineraryRecord['status']) => {
    console.log('[TRIPS] Attempting status update for itinerary:', itineraryId, 'to status:', newStatus);
    
    try {
      setProcessingUpdate(itineraryId);
      
      // Find the itinerary first to log its current state
      const allItineraries = Object.values(sessions).flatMap(s => Object.values(s.itineraries));
      const targetItinerary = allItineraries.find(i => i.id === itineraryId);
      
      if (!targetItinerary) {
        console.error('[TRIPS] ERROR: Could not find itinerary', itineraryId);
        console.log('[TRIPS] Available itineraries:', allItineraries.map(i => ({ id: i.id, title: i.title, status: i.status })));
        return;
      }
      
      console.log('[TRIPS] Found itinerary:', targetItinerary.title, 'current status:', targetItinerary.status);
      
      // Perform the update
      updateStatus(itineraryId, newStatus);
      
      console.log('[TRIPS] Status update completed for:', targetItinerary.title);
      
      // Close the action modal
      setActionFor(null);
      
    } catch (error) {
      console.error('[TRIPS] Error updating status:', error);
    } finally {
      setProcessingUpdate(null);
    }
  };

  const handleDeleteItinerary = async (itineraryId: string) => {
    console.log('[TRIPS] Attempting to delete itinerary:', itineraryId);
    
    try {
      setProcessingUpdate(itineraryId);
      
      deleteItinerary(itineraryId);
      
      console.log('[TRIPS] Itinerary deleted:', itineraryId);
      setActionFor(null);
      
    } catch (error) {
      console.error('[TRIPS] Error deleting itinerary:', error);
    } finally {
      setProcessingUpdate(null);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('Your Trips')}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Upcoming')}</Text>
            {drafts.filter(t=>t.status==='upcoming').map(trip=>{
              // Safe image extraction with null checks
              let cover: string | undefined = trip.image;
              if (!cover && trip.days?.length > 0 && trip.days[0]?.items?.length > 0) {
                cover = trip.days[0].items[0].imageUrl || getCachedImage(trip.days[0].items[0].title);
              }
              const badDomains = ['example.com', 'picsum.photos/seed'];
              if (cover && badDomains.some(d => cover!.includes(d))) { cover = undefined; }
              const uri = cover || `https://picsum.photos/seed/${encodeURIComponent(trip.title)}/600/400`;
              
              // Safe date extraction with error handling
              let startDate = 'TBD';
              let endDate = '';
              try {
                if (trip.days?.length > 0) {
                  const firstDay = trip.days[0];
                  const lastDay = trip.days[trip.days.length - 1];
                  if (firstDay?.date && lastDay?.date) {
                    startDate = format(parseISO(firstDay.date), 'MMM d');
                    endDate = format(parseISO(lastDay.date), 'd');
                  }
                }
              } catch (error) {
                console.warn('[TRIPS] Date parsing error for trip:', trip.title, error);
              }
              const titleStr = trip.title || 'Untitled Trip';
              return (
              <TouchableOpacity key={trip.id} style={styles.tripCard} onPress={()=>openTrip(trip)}>
              <View style={styles.imgHolder}><Image source={{ uri }} style={styles.tripImage} resizeMode="cover"/></View>
              <View style={styles.tripInfo}><Text style={styles.tripTitle}>{titleStr}</Text></View>
              <Pressable style={styles.dots} onPress={()=>setActionFor(trip.id)}><FontAwesome name="ellipsis-v" size={18} color="#ccc"/></Pressable>
              <View style={[styles.statusBadge, styles.upcomingBadge]}><Text style={styles.statusText}>{t('Upcoming')}</Text></View>
              </TouchableOpacity>);
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Drafts')}</Text>
            {drafts.filter(t=>t.status==='draft').map((trip) => {
              // Safe image extraction with null checks
              let cover: string | undefined = trip.image;
              if (!cover && trip.days?.length > 0 && trip.days[0]?.items?.length > 0) {
                cover = trip.days[0].items[0].imageUrl || getCachedImage(trip.days[0].items[0].title);
              }
              const badDomains = ['example.com','picsum.photos/seed'];
              if(cover && badDomains.some(d=>cover!.includes(d))){ cover = undefined; }
              if(!cover && trip.days?.length > 0 && trip.days[0]?.items?.length > 0){
                 const cached = getCachedImage(trip.days[0].items[0].title);
                 if(cached) cover = cached;
              }
              const uri = cover ?? `https://picsum.photos/seed/${encodeURIComponent(trip.title)}/600/400`;
              
              // Safe date extraction with error handling
              let startDate = 'TBD';
              let endDate = '';
              let firstDay = null;
              try {
                if (trip.days?.length > 0) {
                  firstDay = trip.days[0];
                  const lastDay = trip.days[trip.days.length - 1];
                  if (firstDay?.date && lastDay?.date) {
                    startDate = format(parseISO(firstDay.date), 'MMM d');
                    endDate = format(parseISO(lastDay.date), 'd');
                  }
                }
              } catch (error) {
                console.warn('[TRIPS] Date parsing error for draft trip:', trip.title, error);
              }
              const titleStr = trip.title || 'Untitled Trip';
              return (
                <TouchableOpacity key={trip.id} style={styles.tripCard} onPress={()=>openTrip(trip)}>
                  <View style={styles.imgHolder}>
                    <Image
                      source={{ uri }}
                      style={styles.tripImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripTitle}>{titleStr}</Text>
                    <View style={styles.tripDetails}>
                      <View style={styles.detailRow}>
                        <MapPin size={14} color="#999" />
                        <Text style={styles.detailText}>{firstDay?.date?.split('-')[0] || 'TBD'}</Text>
                      </View>
                    </View>
                    <Pressable style={styles.dots} onPress={()=>setActionFor(trip.id)}>
                      <FontAwesome name="ellipsis-v" size={18} color="#ccc" />
                    </Pressable>
                  </View>
                  <View style={[styles.statusBadge, styles.draftBadge]}>
                    <Text style={styles.statusText}>{t('Draft')}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Completed')}</Text>
            {drafts.filter(t=>t.status==='completed').map(trip=>{
              // Safe image extraction with null checks
              let cover: string | undefined = trip.image;
              if (!cover && trip.days?.length > 0 && trip.days[0]?.items?.length > 0) {
                cover = trip.days[0].items[0].imageUrl || getCachedImage(trip.days[0].items[0].title);
              }
              const badDomains = ['example.com', 'picsum.photos/seed'];
              if (cover && badDomains.some(d => cover!.includes(d))) { cover = undefined; }
              const uri = cover || `https://picsum.photos/seed/${encodeURIComponent(trip.title)}/600/400`;
              return (
              <TouchableOpacity key={trip.id} style={styles.tripCard} onPress={()=>openTrip(trip)}>
              <View style={styles.imgHolder}><Image source={{ uri }} style={styles.tripImage} resizeMode="cover"/></View>
              <View style={styles.tripInfo}><Text style={styles.tripTitle}>{trip.title || 'Untitled Trip'}</Text></View>
              <Pressable style={styles.dots} onPress={()=>setActionFor(trip.id)}><FontAwesome name="ellipsis-v" size={18} color="#ccc"/></Pressable>
              <View style={[styles.statusBadge, styles.completedBadge]}><Text style={styles.statusText}>{t('Completed')}</Text></View>
              </TouchableOpacity>);
            })}
          </View>
        </ScrollView>

        {/* Trip Detail Modal */}
        <Modal
          visible={selectedTrip !== null}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          {selectedTrip && (
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedTrip.title}</Text>
                <TouchableOpacity onPress={() => setSelectedTrip(null)}>
                  <X size={24} color="#999" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                <Image source={{ uri: selectedTrip.image }} style={styles.modalImage} />
                
                <View style={styles.modalInfo}>
                  <Text style={styles.modalSubtitle}>{t('Itinerary')} • 5 {t('days')}</Text>
                  
                  <View style={styles.daySection}>
                    <Text style={styles.dayTitle}>{t('Day')} 1 • Tue, Jul 22</Text>
                    <View style={styles.activityCard}>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle}>Hotel AZ Nagano Saku IC</Text>
                        <Text style={styles.activityLocation}>Saku, Nagano</Text>
                        <Text style={styles.activityDescription}>
                          {t('Unassuming rooms in a low-key hotel featuring a casual cafe, as well as free breakfast & parking.')}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.bookButton}
                        onPress={handleBookPress}
                      >
                        <Text style={styles.bookButtonText}>{t('Book')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.daySection}>
                    <Text style={styles.dayTitle}>{t('Day')} 2 • Wed, Jul 23</Text>
                    <View style={styles.activityCard}>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle}>Tokyo Skytree</Text>
                        <Text style={styles.activityLocation}>Sumida, Tokyo</Text>
                        <Text style={styles.activityDescription}>
                          {t('Iconic broadcasting tower with observation decks offering panoramic city views.')}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.bookButton}>
                        <Text style={styles.bookButtonText}>{t('Book')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </Modal>

        {/* Booking Modal */}
        <Modal
          visible={showBookingModal}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <View style={styles.bookingModal}>
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingTitle}>Hotel AZ Nagano Saku IC</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <X size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.bookingContent}>
              <View style={styles.bookingCard}>
                <Text style={styles.bookingLabel}>{t('Check in')}</Text>
                <Text style={styles.bookingValue}>Jul 22</Text>
              </View>
              
              <View style={styles.bookingCard}>
                <Text style={styles.bookingLabel}>{t('Check out')}</Text>
                <Text style={styles.bookingValue}>Jul 23</Text>
              </View>
              
              <View style={styles.bookingCard}>
                <Text style={styles.bookingLabel}>{t('Guests')}</Text>
                <Text style={styles.bookingValue}>2 {t('adults')}</Text>
              </View>
              
              <TouchableOpacity style={styles.confirmBookButton}>
                <Text style={styles.confirmBookButtonText}>{t('Confirm Booking')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.addedButton}>
                <Text style={styles.addedButtonText}>✓ {t('Added')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* action modal */}
        {actionFor && (
          <Modal visible transparent animationType="fade">
            <Pressable style={styles.backdrop} onPress={()=>setActionFor(null)}>
              <View style={styles.sheet}>
                {drafts.find(t=>t.id===actionFor)?.status!=='upcoming' && (
                  <Pressable 
                    onPress={()=>handleStatusUpdate(actionFor,'upcoming')}
                    disabled={processingUpdate === actionFor}
                    style={[styles.optionButton, processingUpdate === actionFor && styles.optionButtonDisabled]}
                  >
                    <Text style={[styles.option, processingUpdate === actionFor && styles.optionDisabled]}>
                      {processingUpdate === actionFor ? 'Updating...' : 'Mark as Upcoming'}
                    </Text>
                  </Pressable>
                )}
                {drafts.find(t=>t.id===actionFor)?.status!=='completed' && (
                  <Pressable 
                    onPress={()=>handleStatusUpdate(actionFor,'completed')}
                    disabled={processingUpdate === actionFor}
                    style={[styles.optionButton, processingUpdate === actionFor && styles.optionButtonDisabled]}
                  >
                    <Text style={[styles.option, processingUpdate === actionFor && styles.optionDisabled]}>
                      {processingUpdate === actionFor ? 'Updating...' : 'Mark as Completed'}
                    </Text>
                  </Pressable>
                )}
                {drafts.find(t=>t.id===actionFor)?.status!=='draft' && (
                  <Pressable 
                    onPress={()=>handleStatusUpdate(actionFor,'draft')}
                    disabled={processingUpdate === actionFor}
                    style={[styles.optionButton, processingUpdate === actionFor && styles.optionButtonDisabled]}
                  >
                    <Text style={[styles.option, processingUpdate === actionFor && styles.optionDisabled]}>
                      {processingUpdate === actionFor ? 'Updating...' : 'Move back to Drafts'}
                    </Text>
                  </Pressable>
                )}

                <Pressable 
                  onPress={()=>handleDeleteItinerary(actionFor)}
                  disabled={processingUpdate === actionFor}
                  style={[styles.optionButton, processingUpdate === actionFor && styles.optionButtonDisabled]}
                >
                  <Text style={[styles.option,{color: processingUpdate === actionFor ? '#999' : '#e74c3c'}]}>
                    {processingUpdate === actionFor ? 'Deleting...' : 'Delete Trip'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  imgHolder: {
    width: '100%',
    height: 180,
    backgroundColor: '#333',
  },
  tripImage: {
    width: '100%',
    height: '100%',
  },
  tripInfo: {
    padding: 16,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  tripDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  draftBadge: {
    backgroundColor: '#FF8C00',
  },
  completedBadge: {
    backgroundColor: '#28A745',
  },
  upcomingBadge: { backgroundColor: '#6B5B95' },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
  },
  modalInfo: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginBottom: 24,
  },
  daySection: {
    marginBottom: 24,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  activityLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#ccc',
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: '#6B5B95',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  bookingModal: {
    flex: 1,
    backgroundColor: '#121212',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  bookingContent: {
    padding: 20,
    gap: 20,
  },
  bookingCard: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
  },
  bookingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    marginBottom: 4,
  },
  bookingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  confirmBookButton: {
    backgroundColor: '#6B5B95',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmBookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addedButton: {
    backgroundColor: '#28A745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  addedButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  dots: { position: 'absolute', bottom: 8, right: 10, padding: 6 },
  sheet: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 12, minWidth: 200 },
  option: { color: '#fff', paddingVertical: 8, textAlign: 'center' },
  optionButton: { 
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.6,
  },
  optionDisabled: {
    color: '#999',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
}); 