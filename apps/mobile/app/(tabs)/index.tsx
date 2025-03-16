import { Text, View, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Index() {
    const insets = useSafeAreaInsets();

    return (
        <ScrollView style={styles.scrollView}>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Text style={styles.title}>Instagram</Text>
                </View>

                <View style={styles.storyContainer}>
                    {['Your Story', 'John', 'Emma', 'David', 'Sarah'].map((name, index) => (
                        <View key={index} style={styles.storyItem}>
                            <View style={styles.storyCircle}>
                                <View style={styles.storyInner} />
                            </View>
                            <Text style={styles.storyName}>{name}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.postCard}>
                    <View style={styles.postHeader}>
                        <View style={styles.postUser}>
                            <View style={styles.postAvatar} />
                            <Text style={styles.postUsername}>user_name</Text>
                        </View>
                        <Text style={styles.postOptions}>•••</Text>
                    </View>

                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3' }}
                        style={styles.postImage}
                    />

                    <View style={styles.postActions}>
                        <View style={styles.actionsLeft}>
                            <Text style={styles.actionIcon}>♡</Text>
                            <Text style={styles.actionIcon}>💬</Text>
                            <Text style={styles.actionIcon}>↗</Text>
                        </View>
                        <Text style={styles.actionIcon}>🔖</Text>
                    </View>

                    <Text style={styles.likesText}>1,234 likes</Text>
                    <Text style={styles.captionText}>
                        <Text style={styles.usernameText}>user_name</Text> Check out this amazing content
                    </Text>
                    <Text style={styles.commentsText}>View all 45 comments</Text>
                    <Text style={styles.timeText}>2 HOURS AGO</Text>
                </View>

                <Text style={styles.sectionTitle}>Explore</Text>

                <View style={styles.exploreGrid}>
                    {[1, 2, 3, 4].map((item) => (
                        <Pressable key={item} style={styles.exploreItem}>
                            <View style={styles.exploreImagePlaceholder} />
                        </Pressable>
                    ))}
                </View>

                <Link href="/about" style={styles.button}>
                    Go to About screen
                </Link>

                <View style={{ height: 100 }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        paddingHorizontal: 15,
        minHeight: '100%',
        backgroundColor: '#fff',
    },
    header: {
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#262626',
        fontFamily: 'System',
    },
    storyContainer: {
        flexDirection: 'row',
        paddingVertical: 10,
        overflow: 'scroll',
    },
    storyItem: {
        alignItems: 'center',
        marginRight: 15,
    },
    storyCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E1306C',
    },
    storyInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#efefef',
    },
    storyName: {
        fontSize: 12,
        marginTop: 4,
        color: '#262626',
    },
    divider: {
        height: 0.5,
        backgroundColor: '#DBDBDB',
        marginVertical: 10,
    },
    postCard: {
        marginBottom: 15,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    postUser: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FAFAFA',
        borderWidth: 0.5,
        borderColor: '#DBDBDB',
    },
    postUsername: {
        marginLeft: 10,
        fontWeight: '600',
        color: '#262626',
    },
    postOptions: {
        color: '#262626',
        fontSize: 16,
    },
    postImage: {
        width: '100%',
        height: 375,
        backgroundColor: '#FAFAFA',
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    actionsLeft: {
        flexDirection: 'row',
    },
    actionIcon: {
        fontSize: 22,
        marginRight: 15,
        color: '#262626',
    },
    likesText: {
        fontWeight: '600',
        color: '#262626',
        marginBottom: 4,
    },
    captionText: {
        color: '#262626',
        marginBottom: 4,
    },
    usernameText: {
        fontWeight: '600',
    },
    commentsText: {
        color: '#8E8E8E',
        marginBottom: 4,
    },
    timeText: {
        color: '#8E8E8E',
        fontSize: 10,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#262626',
        marginVertical: 16,
    },
    exploreGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    exploreItem: {
        width: '48%',
        aspectRatio: 1,
        marginBottom: 10,
    },
    exploreImagePlaceholder: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: '#DBDBDB',
    },
    button: {
        alignSelf: 'center',
        backgroundColor: '#0095F6',
        padding: 14,
        borderRadius: 4,
        paddingHorizontal: 30,
        marginVertical: 20,
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        overflow: 'hidden',
        textDecorationLine: 'none',
    },
});