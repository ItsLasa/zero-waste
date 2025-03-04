"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Coins,
  LogOut,
  Search,
  Settings,
  User,
  LogIn,
  ChevronDown,
  Bell,
  Leaf,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Badge } from "./ui/badge";
import { Web3Auth,Web3AuthOptions } from "@web3auth/modal";

import { CHAIN_NAMESPACES, IProvider,IAdapter, WEB3AUTH_NETWORK } from "@web3auth/base";

import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import {
  createUser,
  getUnreadNotifications,
  getUserBalance,
  getUserByEmail,
  markNotificationsAsRead,
} from "@/utils/db/actions";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const clientId =
  "BLMmjOS-jcrszmmZOrqyGlvGLkcKNv1nI1lw353gFILt5c96D5d50N0p3oWttj_YR7ExkpQsvPBiN_9vtwmC6U8";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  displayName: "Sepolia Mainnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Etherum",
  logo: "http://assets.web3auth.io/evm-chains/sepolia.svg",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3AuthOptions: Web3AuthOptions = {
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
}
const web3auth = new Web3Auth(web3AuthOptions);

interface HeaderProps {
  onMenuClick: () => void;
  totalEarnings: number;
}

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [nofitications, setNotifications] = useState<Notification[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.initModal();
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
          if (user.email) {
            localStorage.setItem('userEmail', user.email);
            try {
              await createUser(user.email, user.name || 'Anonymous User');
            } catch (error) {
              console.error("Error creating user:", error);
              // Handle the error appropriately, maybe show a message to the user
            }
          }
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (userInfo && userInfo.email) {
        const user = await getUserByEmail(userInfo.email);
        if (user) {
          const unreadNotifications = await getUnreadNotifications(user.id);
          setNotifications(unreadNotifications);
        }
      }
    };
    fetchNotifications();
    const nofiticationInterval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(nofiticationInterval);
  }, [userInfo]);

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (userInfo && userInfo.email) {
        const user = await getUserByEmail(userInfo.email);
        if (user) {
          const userBalance = await getUserBalance(user.id);
          setBalance(userBalance);
        }
      }
    };
    fetchUserBalance();
    const handleBalanceUpdate = (event: CustomEvent) => {
      setBalance(event.detail);
    };
    window.addEventListener(
      "balanceUpdate",
      handleBalanceUpdate as EventListener
    );
    return () => {
      window.removeEventListener(
        "balanceUpdate",
        handleBalanceUpdate as EventListener
      );
    };
  }, [userInfo]);

  const login = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      setLoggedIn(true);
      const user = await web3auth.getUserInfo();
      setUserInfo(user);
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        try {
          await createUser(user.email, user.name || 'Anonymous User');
        } catch (error) {
          console.error("Error creating user:", error);
          // Handle the error appropriately, maybe show a message to the user
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const logout = async () => {
    if (!web3auth) {
      console.error("web3Auth is not initialized");
      return;
    }
    try {
      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
      setUserInfo(null);
      localStorage.removeItem("userEmail");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getUserInfo = async () => {
    if (web3auth.connected) {
      const user = await web3auth.getUserInfo();
      setUserInfo(user);

      if (user.email) {
        localStorage.setItem("userEmail", user.email);
        try {
          await createUser(user.email, user.name || "anonymous user");
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
    }
  };

  const handleNotificationClick = async (nofiticationId: number) => {
    await markNotificationsAsRead(nofiticationId);
  };

  if (loading) {
    return <div>Loading Web3 Auth.....</div>;
  }

  return (
    <header className="bg-zinc-100 border-b border-gray-200 sticky top-0 z-50">
  <div className="flex items-center justify-between p-4 py-2">
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="mr-2 md:mr-4"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
      </Button>
      <Link href="/" className="flex items-center">
        <Leaf className="h-6 w-6 md:w-8 text-green-500 r-1 md:mr-2 " />
        <span className="font-bold text-base md:text-gray-800">
          Zero2Hero
        </span>
      </Link>
    </div>

    {!isMobile && (
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full py-2 pl-6 pr-4 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-800"
          />
          <Search className="absolute top-1/2 right-4 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
      </div>
    )}

    <div className="flex items-center">
      {isMobile && (
        <Button variant={"ghost"} size="icon" className="mr-2">
          <Search className="h-5 w-5" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-2 relative">
            <Bell className="h-5 w-5 text-gray-800" />
            {nofitications.length > 0 && (
              <Badge className="absolute -top-0 h-5 min-w-[1.2rem] -right-0 bg-red-500">
                {nofitications.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {nofitications.length > 0 ? (
            nofitications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{notification.type}</span>
                  <span className="text-sm text-gray-800">
                    {notification.message}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem>No New Notifications</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mr-2 md:mr-4 flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1">
        <Coins className="text-semibold text-sm mr-1 md:h-5 md:w-5 text-green-600" />
        <span className="font-semibold text text-gray-800 text-sm md:text-base">
          {balance.toFixed(2)}
        </span>
      </div>

      {!loggedIn ? (
        <Button
          onClick={login}
          className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base"
        >
          Login
          <LogIn className="ml-1 md:d" />
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="items-center relative">
              <User className="h-5 w-5" />
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onClick={getUserInfo}>
              {userInfo ? userInfo.name : "Profile"} {/* Render userInfo.name */}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  </div>
</header>
  );
}
