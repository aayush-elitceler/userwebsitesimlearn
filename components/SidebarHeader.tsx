import {
    Collapsible,
} from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Separator } from "@/components/ui/separator"; // Import Separator from shadcn
import React from "react";
import { StaticImageData } from "next/image";
import Image from "next/image";


export function SidebarHeader({
    items,
}: {
    items: {
        title: string;
        url: string;
        icon?: string | StaticImageData; // Image path
        isActive?: boolean;
    }[];
}) {
    return (
        <SidebarGroup className="overflow-hidden p-0">
            <SidebarMenu>
                {items.map((item, index) => {
                    return (
                        <React.Fragment key={item.title}>
                            <Collapsible
                                asChild
                                defaultOpen={item.isActive}
                                className="group/collapsible"
                            >
                                <Link href={item.url}>
                                    <SidebarMenuButton
                                        size="lg"
                                        tooltip={item.title}
                                    >
                                        {item.icon && (
                                            <Image
                                                src={item.icon}
                                                alt={item.title}
                                                width={160}
                                                height={60}
                                                className="object-contain mx-auto my-6"
                                            />
                                        )}
                                    </SidebarMenuButton>
                                </Link>
                            </Collapsible>

                            {/* Add separator after each item except the last one */}
                            {index !== items.length - 1 && (
                                <Separator className="my-2 left-5 w-[185px] bg-[#235EDE]" />
                            )}
                        </React.Fragment>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
